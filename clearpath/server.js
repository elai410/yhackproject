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
    summary TEXT,
    department TEXT,
    room TEXT,
    floor TEXT,
    urgency TEXT,
    reason TEXT,
    status TEXT DEFAULT 'waiting',
    phone TEXT,
    language TEXT DEFAULT 'en',
    sentiment TEXT DEFAULT 'calm',
    sentimentNote TEXT,
    queue_position INTEGER,
    checked_in_at TEXT DEFAULT (datetime('now')),
    called_at TEXT,
    discharged_at TEXT,
    last_updated_at TEXT DEFAULT (datetime('now'))
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
  const { name, situation, summary, department, room, floor, urgency, reason, phone, language, sentiment, sentimentNote } = req.body;
  const id = uuid();
 
  const count = db.prepare(
    `SELECT COUNT(*) as c FROM patients WHERE department=? AND status='waiting'`
  ).get(department).c;
 
  db.prepare(`
    INSERT INTO patients (id, name, situation, summary, department, room, floor, urgency, reason, phone, language, sentiment, sentimentNote, queue_position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name || "Patient", situation, summary || situation, department, room, floor, urgency, reason, phone || "", language || "en", sentiment || "calm", sentimentNote || "", count + 1);
 
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
        system: `You are a hospital triage router and translator for Yale New Haven Hospital. Given a patient situation:
1. Detect the language they are writing in
2. Route them to the correct department
3. Translate all UI strings into their language

Respond ONLY with a JSON object (no markdown, no backticks) in this exact format:
{
  "department": "one of the department ids below",
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
    "alert_room": "Please head to (translated)",
    "alert_wait_msg": "We'll alert you when it's almost your turn. You don't need to stay glued to this screen. (translated)",
    "allset": "You're all set! (translated)",
    "thank_you": "Thank you for visiting ClearPath (translated)",
    "directions": ["Enter through the main entrance (translated)", "Follow the blue line on the floor (translated)", "Take the corridor indicated (translated)", "Look for your destination building (translated)"],
    "expect": ["Show your QR code or give your name at the desk (translated)", "A nurse will take your vitals (translated)", "A doctor will see you shortly after (translated)"],
    "back": "Back (translated)",
    "min": "min (translated)",
    "urgency_label": "urgency (translated)"
  }
}

Available departments and when to use them:
- "rabies" — dog, cat, bat, or any animal bite needing rabies vaccine
- "emergency" — life-threatening: chest pain, difficulty breathing, stroke, severe bleeding, unconscious
- "pediatric" — children under 18 with any condition; also maternity and labor/delivery
- "triage" — general admitting, check-in, preadmission testing, not sure where to go
- "atrium" — information, gift shop, cafeteria, volunteer services, non-medical needs
- "clinicbldg" — MRI, PET scan, neuroradiology, heart/vascular aortic issues
- "dana" — digestive health, eye issues, diabetes, bone/joint issues, cardiology
- "ypb" — orthopedics, general surgery, nuclear medicine, transplantation
- "north" — breast center, gynecology, operating rooms, oncology, radiology
- "fitkin" — EEG, neurophysiology, pulmonary function, chest clinic
- "winchester" — psychiatry, child psychiatry, Nathan Smith Clinic

Respond in the same language the patient used.`,
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

// Add this route to server.js before server.listen()

app.get("/api/analytics", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const totalToday = db.prepare(`
    SELECT COUNT(*) as count FROM patients
    WHERE date(checked_in_at) = date('now')
  `).get().count;

  const discharged = db.prepare(`
    SELECT COUNT(*) as count FROM patients
    WHERE status = 'discharged' AND date(checked_in_at) = date('now')
  `).get().count;

  const avgWaitByDept = db.prepare(`
    SELECT department,
      ROUND(AVG((julianday(called_at) - julianday(checked_in_at)) * 24 * 60), 1) as avg_wait_minutes,
      COUNT(*) as total
    FROM patients
    WHERE called_at IS NOT NULL AND date(checked_in_at) = date('now')
    GROUP BY department
  `).all();

  const urgencyBreakdown = db.prepare(`
    SELECT urgency, COUNT(*) as count FROM patients
    WHERE date(checked_in_at) = date('now')
    GROUP BY urgency
  `).all();

  const byHour = db.prepare(`
    SELECT strftime('%H', checked_in_at) as hour, COUNT(*) as count
    FROM patients
    WHERE date(checked_in_at) = date('now')
    GROUP BY hour
    ORDER BY hour ASC
  `).all();

  const languages = db.prepare(`
    SELECT language, COUNT(*) as count FROM patients
    WHERE date(checked_in_at) = date('now')
    GROUP BY language
    ORDER BY count DESC
  `).all();

  const currentlyWaiting = db.prepare(`
    SELECT COUNT(*) as count FROM patients WHERE status = 'waiting'
  `).get().count;

  res.json({
    totalToday,
    discharged,
    currentlyWaiting,
    avgWaitByDept,
    urgencyBreakdown,
    byHour,
    languages,
  });
});

// Add this to server.js before server.listen()

app.post("/api/converse", async (req, res) => {
  const { messages, language } = req.body;

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
        system: `You are a compassionate triage nurse at Yale New Haven Hospital. Your job is to:
1. Ask clarifying questions to understand the patient's situation (max 2-3 questions total)
2. Once you have enough information, route them to the right department
3. Detect their language and respond in that same language throughout
4. Assess their emotional state

You have two modes:

MODE 1 - QUESTIONING: If you need more information, respond with ONLY a JSON object:
{
  "mode": "question",
  "question": "Your follow-up question here, warm and conversational",
  "detectedLanguage": "English|Spanish|etc"
}

MODE 2 - ROUTING: Once you have enough info (after 1-3 exchanges), respond with ONLY a JSON object:
{
  "mode": "route",
  "department": "one of: rabies|emergency|pediatric|triage|atrium|clinicbldg|dana|ypb|north|fitkin|winchester",
  "reason": "one sentence why, in patient's language",
  "urgency": "low|medium|high",
  "sentiment": "one of: calm|anxious|scared|confused|distressed|in-pain",
  "sentimentNote": "short human note for staff e.g. 'Patient is scared and traveling alone'",
  "detectedLanguage": "English|Spanish|etc",
  "summary": "2-sentence summary of the patient's situation for staff",
  "ui": {
    "heading": "What brings you in today? (translated)",
    "sub": "Describe your situation in your own words. (translated)",
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
    "alert_room": "Please head to (translated)",
    "alert_wait_msg": "We'll alert you when it's almost your turn. (translated)",
    "allset": "You're all set! (translated)",
    "thank_you": "Thank you for visiting ClearPath (translated)",
    "directions": ["Enter through the main entrance (translated)", "Follow the blue line (translated)", "Take the corridor indicated (translated)", "Look for your destination (translated)"],
    "expect": ["Show your QR code at the desk (translated)", "A nurse will take your vitals (translated)", "A doctor will see you shortly (translated)"],
    "back": "Back (translated)",
    "min": "min (translated)",
    "urgency_label": "urgency (translated)"
  }
}

Departments:
- rabies: animal bites needing vaccine
- emergency: life-threatening conditions
- pediatric: children under 18, maternity, labor/delivery
- triage: general admitting, not sure where to go
- atrium: information, cafeteria, non-medical
- clinicbldg: MRI, PET scan, neuroradiology
- dana: digestive, eye, diabetes, cardiology
- ypb: orthopedics, general surgery, transplantation
- north: breast center, gynecology, oncology, operating rooms
- fitkin: EEG, neurophysiology, pulmonary, chest clinic
- winchester: psychiatry, child psychiatry

IMPORTANT: Never ask more than 3 questions total. If you have enough to route after 1 question, do it. Always be warm and reassuring.`,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    const text = data.content.find((b) => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      mode: "question",
      question: "I'm sorry, I'm having trouble connecting. Can you describe your situation again?",
      detectedLanguage: "English",
    });
  }
});

app.get("/api/handoff-summary", async (req, res) => {
  const patients = db.prepare(
    `SELECT * FROM patients WHERE status != 'discharged' ORDER BY checked_in_at ASC`
  ).all();
 
  if (patients.length === 0) {
    return res.json({ summary: "No patients currently in the system." });
  }
 
  const patientList = patients.map(p =>
    `- ${p.name}: ${p.situation} | Dept: ${p.department} | Urgency: ${p.urgency} | Status: ${p.status} | Waiting since: ${p.checked_in_at}`
  ).join("\n");
 
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
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are a hospital charge nurse. Generate a concise shift handoff summary for the incoming team based on these current patients:\n\n${patientList}\n\nWrite 3-5 sentences covering: total patients, any high urgency cases, who has been waiting longest, and anything the incoming team should prioritize. Be direct and clinical.`,
        }],
      }),
    });
    const data = await response.json();
    const summary = data.content.find(b => b.type === "text")?.text || "Could not generate summary.";
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ summary: "Could not generate summary." });
  }
});

// ── Add this to server.js before server.listen() ─────────────────────────────

// Stuck thresholds in minutes per status
const STUCK_THRESHOLDS = {
  waiting:           30,
  in_progress:       60,
  pending_test:      45,
  pending_signature: 20,
  pending_transport: 15,
  pending_bed:       40,
};

// Update /api/patients to use per-status thresholds
// REPLACE your existing /api/patients route with this:
app.get("/api/patients", (req, res) => {
  const patients = db.prepare(
    `SELECT * FROM patients WHERE status != 'discharged' ORDER BY checked_in_at ASC`
  ).all();

  const now = Date.now();
  const annotated = patients.map(p => {
    const waitMs   = now - new Date(p.checked_in_at + "Z").getTime();
    const waitMins = Math.floor(waitMs / 1000 / 60);
    const threshold = STUCK_THRESHOLDS[p.status] || 30;
    const isStuck  = !!STUCK_THRESHOLDS[p.status] && waitMins >= threshold;
    return { ...p, wait_minutes: waitMins, is_stuck: isStuck };
  });

  res.json(annotated);
});

// New route: update patient status
app.post("/api/update-status/:id", (req, res) => {
  const { status, statusNote } = req.body;
  const validStatuses = ["waiting", "in_progress", "pending_test", "pending_signature", "pending_transport", "pending_bed", "called"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.prepare(
    `UPDATE patients SET status=?, last_updated_at=datetime('now') WHERE id=?`
  ).run(status, req.params.id);

  const updated = db.prepare(`SELECT * FROM patients WHERE id=?`).get(req.params.id);

  // Notify the patient's phone with a status-specific message
  const STATUS_MESSAGES = {
    in_progress:       "A care team member is with you now.",
    pending_test:      "Your test is in progress. We'll update you when results are ready.",
    pending_signature: "Your paperwork is being reviewed by a doctor.",
    pending_transport: "Transport has been arranged and is on the way.",
    pending_bed:       "We're preparing your room. Thank you for your patience.",
  };

  if (STATUS_MESSAGES[status]) {
    notifyPatient(req.params.id, {
      type: "STATUS_UPDATE",
      status,
      message: STATUS_MESSAGES[status],
    });
  }

  broadcast({ type: "QUEUE_UPDATED", queue: getAllPatients() });
  res.json({ success: true, patient: updated });
});

server.listen(PORT, () => console.log(`✅ ClearPath backend running on http://localhost:${PORT}`));