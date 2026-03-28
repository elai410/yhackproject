import "dotenv/config";

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import Database from "better-sqlite3";
import cors from "cors";
import { v4 as uuid } from "uuid";

// ── Setup ─────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("clearpath.db");
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ── DB Schema ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    situation TEXT,
    department TEXT,
    room TEXT,
    floor TEXT,
    urgency TEXT,
    reason TEXT,
    status TEXT DEFAULT 'waiting',
    phone TEXT,
    language TEXT DEFAULT 'en',
    queue_position INTEGER,
    checked_in_at TEXT DEFAULT (datetime('now')),
    called_at TEXT,
    discharged_at TEXT
  );
`);

// ── WebSocket broadcast ───────────────────────────────────────────────────────
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => { if (c.readyState === 1) c.send(msg); });
}

const patientSockets = new Map();
wss.on("connection", (ws, req) => {
  const id = new URL(req.url, "http://localhost").searchParams.get("id");
  if (id) patientSockets.set(id, ws);
  ws.on("close", () => { if (id) patientSockets.delete(id); });
});

function notifyPatient(id, data) {
  const ws = patientSockets.get(id);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getQueue(department) {
  return db.prepare(
    `SELECT * FROM patients WHERE department=? AND status='waiting' ORDER BY checked_in_at ASC`
  ).all(department);
}

function getAllPatients() {
  return db.prepare(
    `SELECT * FROM patients WHERE status != 'discharged' ORDER BY checked_in_at ASC`
  ).all();
}

function recalcPositions(department) {
  const queue = getQueue(department);
  const stmt = db.prepare(`UPDATE patients SET queue_position=? WHERE id=?`);
  queue.forEach((p, i) => stmt.run(i + 1, p.id));
  return queue;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Check in a new patient
app.post("/api/checkin", (req, res) => {
  const { name, situation, department, room, floor, urgency, reason, phone, language } = req.body;
  const id = uuid();

  const count = db.prepare(
    `SELECT COUNT(*) as c FROM patients WHERE department=? AND status='waiting'`
  ).get(department).c;

  db.prepare(`
    INSERT INTO patients (id, name, situation, department, room, floor, urgency, reason, phone, language, queue_position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name || "Patient", situation, department, room, floor, urgency, reason, phone || "", language || "en", count + 1);

  const patient = db.prepare(`SELECT * FROM patients WHERE id=?`).get(id);
  broadcast({ type: "PATIENT_JOINED", patient, queue: getAllPatients() });
  res.json({ success: true, patient });
});

// Get a single patient
app.get("/api/patient/:id", (req, res) => {
  const patient = db.prepare(`SELECT * FROM patients WHERE id=?`).get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Not found" });
  res.json(patient);
});

// Get all patients (staff dashboard)
app.get("/api/patients", (req, res) => {
  res.json(getAllPatients());
});

// Get queue for a department
app.get("/api/queue/:department", (req, res) => {
  res.json(getQueue(req.params.department));
});

// Staff: call next patient
app.post("/api/call-next/:department", (req, res) => {
  const queue = getQueue(req.params.department);
  if (!queue.length) return res.json({ success: false, message: "Queue empty" });

  const next = queue[0];
  db.prepare(`UPDATE patients SET status='called', called_at=datetime('now') WHERE id=?`).run(next.id);
  recalcPositions(req.params.department);

  const updated = db.prepare(`SELECT * FROM patients WHERE id=?`).get(next.id);
  notifyPatient(next.id, { type: "YOU_ARE_CALLED", patient: updated });
  broadcast({ type: "QUEUE_UPDATED", queue: getAllPatients() });

  res.json({ success: true, patient: updated });
});

// Staff: move patient to a different department
app.post("/api/move/:id", (req, res) => {
  const { department, room, floor, reason } = req.body;
  db.prepare(`UPDATE patients SET department=?, room=?, floor=?, reason=?, status='waiting' WHERE id=?`)
    .run(department, room, floor, reason, req.params.id);
  recalcPositions(department);

  const updated = db.prepare(`SELECT * FROM patients WHERE id=?`).get(req.params.id);
  notifyPatient(req.params.id, { type: "DEPARTMENT_CHANGED", patient: updated });
  broadcast({ type: "QUEUE_UPDATED", queue: getAllPatients() });

  res.json({ success: true, patient: updated });
});

// Staff: discharge patient with instructions
app.post("/api/discharge/:id", (req, res) => {
  const { instructions } = req.body;
  db.prepare(`UPDATE patients SET status='discharged', discharged_at=datetime('now') WHERE id=?`).run(req.params.id);

  notifyPatient(req.params.id, {
    type: "DISCHARGED",
    instructions: instructions || "You have been discharged. Please follow up with your primary care physician.",
  });

  broadcast({ type: "QUEUE_UPDATED", queue: getAllPatients() });
  res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = 3001;

// Paste this route into server.js BEFORE the server.listen() line at the bottom

app.post("/api/route", async (req, res) => {
  const { situation, language } = req.body;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a hospital triage router. Given a patient situation, respond ONLY with a JSON object (no markdown, no backticks) in this format:
{"department":"rabies|emergency|pediatric|triage","reason":"one sentence why","urgency":"low|medium|high"}
Departments: rabies=dog/animal bites needing vaccine, emergency=life-threatening, pediatric=children under 12, triage=general illness.
Respond in the same language the patient used.`,
        messages: [{ role: "user", content: situation }],
      }),
    });
    const data = await response.json();
    const text = data.content.find((b) => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: "Routing failed", department: "triage", reason: "Please see general triage", urgency: "low" });
  }
});

server.listen(PORT, () => console.log(`✅ ClearPath backend running on http://localhost:${PORT}`));