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
app.post("/api/checkin", async (req, res) => {
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
app.post("/api/call-next/:department", async(req, res) => {
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

// Replace your existing /api/route endpoint in server.js with this:

app.post("/api/route", async (req, res) => {
  const { situation } = req.body;
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
        max_tokens: 1500,
        system: `You are a hospital triage router and translator. Given a patient situation:
1. Detect the language they are writing in
2. Route them to the correct department
3. Translate all UI strings into their language

Respond ONLY with a JSON object (no markdown, no backticks) in this exact format:
{
  "department": "rabies|emergency|pediatric|triage",
  "reason": "one sentence why, in the patient's language",
  "urgency": "low|medium|high",
  "detectedLanguage": "English|Spanish|French|Arabic|etc",
  "ui": {
    "heading": "What brings you in today? (translated)",
    "sub": "Describe your situation in your own words. We'll guide you to the right place. (translated)",
    "btn_route": "Find my care (translated)",
    "btn_checkin": "Confirm check-in (translated)",
    "btn_arrived": "I've arrived — show my queue position (translated)",
    "btn_followup": "Get follow-up reminder (translated)",
    "label_routed": "You've been routed to (translated)",
    "label_position": "Your position (translated)",
    "label_queue": "in line at (translated)",
    "label_wait": "Estimated wait (translated)",
    "label_directions": "Walking directions (translated)",
    "label_qr": "Your check-in QR (translated)",
    "label_discharge": "Discharge instructions (translated)",
    "label_followup_card": "Your 3-day follow-up reminder (translated)",
    "label_name": "Your name (optional) (translated)",
    "label_phone": "Phone for SMS alerts (optional) (translated)",
    "alert_turn": "It's your turn! (translated)",
    "alert_room": "Please head to Room (translated)",
    "alert_wait_msg": "We'll alert you when it's almost your turn. You don't need to stay glued to this screen. (translated)",
    "allset": "You're all set! (translated)",
    "thank_you": "Thank you for visiting ClearPath (translated)",
    "directions": ["Enter through the main entrance (translated)", "Follow the blue line on the floor (translated)", "Take the corridor (translated)", "Look for your room (translated)"],
    "expect": ["Show your QR code or give your name at the desk (translated)", "A nurse will take your vitals (translated)", "A doctor will see you shortly after (translated)"],
    "back": "Back (translated)",
    "min": "min (translated)",
    "urgency_label": "urgency (translated)"
  }
}

Departments: rabies=dog/animal bites needing vaccine, emergency=life-threatening, pediatric=children under 12, triage=general illness.`,
        messages: [{ role: "user", content: situation }],
      }),
    });
    const data = await response.json();
    const text = data.content.find((b) => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "Routing failed",
      department: "triage",
      reason: "Please see general triage",
      urgency: "low",
      detectedLanguage: "English",
      ui: null,
    });
  }
});

server.listen(PORT, () => console.log(`✅ ClearPath backend running on http://localhost:${PORT}`));