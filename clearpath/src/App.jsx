import { useState, useEffect, useRef } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";

const API = "http://localhost:3001";
const WS  = "ws://localhost:3001";

const DEPARTMENTS = {
  rabies:    { id: "rabies",    name: "Rabies Vaccine Clinic", floor: "1", room: "A3", wait: 12 },
  emergency: { id: "emergency", name: "Emergency Room",        floor: "2", room: "B1", wait: 38 },
  pediatric: { id: "pediatric", name: "Pediatric ER",          floor: "2", room: "B4", wait: 22 },
  triage:    { id: "triage",    name: "General Triage",        floor: "1", room: "A1", wait: 8  },
};

// ── Floor Plan ────────────────────────────────────────────────────────────────
function FloorPlan({ activeRoom }) {
  const rooms = [
    { id: "triage",   label: "Triage A1", x: 60,  y: 80,  w: 140, h: 80 },
    { id: "rabies",   label: "Rabies A3", x: 60,  y: 200, w: 140, h: 80 },
    { id: "pharmacy", label: "Pharmacy",  x: 280, y: 80,  w: 120, h: 80 },
    { id: "waiting",  label: "Waiting",   x: 280, y: 200, w: 120, h: 80 },
    { id: "entrance", label: "Entrance",  x: 170, y: 340, w: 100, h: 50 },
  ];
  const paths = {
    triage:   "M220,340 L220,300 L130,300 L130,160",
    rabies:   "M220,340 L220,300 L130,300 L130,280",
    pharmacy: "M220,340 L220,300 L340,300 L340,160",
    waiting:  "M220,340 L220,300 L340,300 L340,280",
  };
  return (
    <svg width="100%" viewBox="0 0 480 420" style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <rect x="40" y="290" width="400" height="20" rx="4" fill="#f0f0f0" stroke="#ccc" strokeWidth="0.5"/>
      <rect x="230" y="60"  width="20"  height="250" rx="4" fill="#f0f0f0" stroke="#ccc" strokeWidth="0.5"/>
      {rooms.map((r) => (
        <g key={r.id}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8"
            fill={r.id === activeRoom ? "#3B8BD4" : "#e8f4fd"}
            stroke={r.id === activeRoom ? "#185FA5" : "#aacde8"}
            strokeWidth={r.id === activeRoom ? 2 : 0.5}/>
          <text x={r.x + r.w/2} y={r.y + r.h/2} textAnchor="middle" dominantBaseline="central"
            fontSize="13" fontWeight={r.id === activeRoom ? 600 : 400}
            fill={r.id === activeRoom ? "#fff" : "#185FA5"}>
            {r.label}
          </text>
        </g>
      ))}
      {activeRoom && paths[activeRoom] && (
        <path d={paths[activeRoom]} fill="none" stroke="#3B8BD4" strokeWidth="3"
          strokeDasharray="8 4" strokeLinecap="round" markerEnd="url(#arrow)"
          style={{ animation: "dash 1.2s linear infinite" }}/>
      )}
      <style>{`@keyframes dash { to { stroke-dashoffset: -24; } }`}</style>
    </svg>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Intake", "Check-in", "Navigate", "Queue", "Care", "Discharge"];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px",
            background: i < current ? "#3B8BD4" : i === current ? "#185FA5" : "#e2e8f0",
            color: i <= current ? "#fff" : "#94a3b8",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600
          }}>{i < current ? "✓" : i + 1}</div>
          <div style={{ fontSize: 10, color: i === current ? "#185FA5" : "#94a3b8", fontWeight: i === current ? 600 : 400 }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]           = useState(0);
  const [situation, setSituation] = useState("");
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [lang, setLang]           = useState("en");
  const [loading, setLoading]     = useState(false);
  const [patient, setPatient]     = useState(null);
  const [dept, setDept]           = useState(null);
  const [queuePos, setQueuePos]   = useState(null);
  const [discharge, setDischarge] = useState(null);
  const [followUp, setFollowUp]   = useState("");
  const wsRef = useRef(null);

  // ── WebSocket connection ──
  function connectWS(patientId) {
    const ws = new WebSocket(`${WS}?id=${patientId}`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "YOU_ARE_CALLED") setStep(4);
      if (msg.type === "QUEUE_UPDATED") {
        fetch(`${API}/api/patient/${patientId}`)
          .then(r => r.json())
          .then(p => setQueuePos(p.queue_position));
      }
      if (msg.type === "DISCHARGED") {
        setDischarge(msg.instructions);
        setStep(5);
      }
      if (msg.type === "DEPARTMENT_CHANGED") {
        setPatient(msg.patient);
        setDept(DEPARTMENTS[msg.patient.department] || dept);
        setStep(2);
      }
    };
    wsRef.current = ws;
  }

  // ── Step 0 → 1: Route with Claude via backend ──
  async function handleRoute() {
    if (!situation.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, language: lang }),
      });
      const data = await res.json();
      setDept(DEPARTMENTS[data.department] || DEPARTMENTS.triage);
      setPatient({ ...data, situation });
      setStep(1);
    } catch {
      alert("Could not connect to server. Is it running?");
    }
    setLoading(false);
  }

  // ── Step 1 → 2: Check in ──
  async function handleCheckin() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Patient",
          situation,
          department: dept.id,
          room: dept.room,
          floor: dept.floor,
          urgency: patient.urgency,
          reason: patient.reason,
          phone,
          language: lang,
        }),
      });
      const data = await res.json();
      setPatient(data.patient);
      setQueuePos(data.patient.queue_position);
      connectWS(data.patient.id);
      setStep(2);
    } catch {
      alert("Check-in failed. Is the server running?");
    }
    setLoading(false);
  }

  // ── Follow-up via Claude ──
  async function handleFollowUp() {
    setLoading(true);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `A patient was treated for: ${patient?.situation}. Discharge instructions: ${discharge}. Write a warm 2-sentence follow-up reminder they should read in 3 days. Keep it simple and caring.`
        }]
      })
    });
    const data = await res.json();
    setFollowUp(data.content.find(b => b.type === "text")?.text || "");
    setLoading(false);
  }

  const urgencyColor = (u) =>
    u === "high" ? "#fee2e2" : u === "medium" ? "#fef9c3" : "#dcfce7";

  return (
    <div style={S.root}>
      <header style={S.header}>
        <span style={S.logo}>＋</span>
        <h1 style={S.title}>ClearPath</h1>
        <select value={lang} onChange={e => setLang(e.target.value)} style={S.langSel}>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </header>

      <div style={S.body}>
        <Steps current={step} />

        {/* ── Step 0: Symptom intake ── */}
        {step === 0 && (
          <div style={S.section}>
            <h2 style={S.heading}>What brings you in today?</h2>
            <p style={S.sub}>Describe your situation in your own words. We'll guide you to the right place.</p>
            <textarea value={situation} onChange={e => setSituation(e.target.value)}
              placeholder={lang === "es" ? "Describa su situación…" : "e.g. my brother was bitten by a dog…"}
              rows={3} style={S.textarea}/>
            <button onClick={handleRoute} disabled={loading} style={S.btn}>
              {loading ? "Routing…" : "Find my care →"}
            </button>
          </div>
        )}

        {/* ── Step 1: Check-in confirmation ── */}
        {step === 1 && dept && patient && (
          <div style={S.section}>
            <div style={{ ...S.card, borderLeft: "4px solid #3B8BD4" }}>
              <p style={S.label}>You've been routed to</p>
              <h2 style={S.deptName}>{dept.name}</h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0" }}>Floor {dept.floor} · Room {dept.room}</p>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>{patient.reason}</p>
              <span style={{ ...S.badge, background: urgencyColor(patient.urgency) }}>
                {patient.urgency} urgency
              </span>
            </div>
            <div style={S.card}>
              <p style={S.label}>Your details</p>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)" style={S.input}/>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Phone for SMS alerts (optional)" style={S.input} type="tel"/>
            </div>
            <button onClick={handleCheckin} disabled={loading} style={S.btn}>
              {loading ? "Checking in…" : "Confirm check-in →"}
            </button>
            <button onClick={() => setStep(0)} style={S.ghost}>← Back</button>
          </div>
        )}

        {/* ── Step 2: Navigate ── */}
        {step === 2 && dept && (
          <div style={S.section}>
            <div style={S.card}>
              <p style={S.label}>Head to</p>
              <h2 style={S.deptName}>{dept.name}</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>Floor {dept.floor} · Room {dept.room}</p>
            </div>
            <FloorPlan activeRoom={dept.id} />
            <div style={S.card}>
              <p style={S.label}>Walking directions</p>
              <ol style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 14, lineHeight: 1.8 }}>
                <li>Enter through the main entrance</li>
                <li>Follow the blue line on the floor</li>
                <li>Take the corridor on the {dept.floor === "1" ? "left" : "right"}</li>
                <li>Look for Room {dept.room} on your {dept.floor === "1" ? "left" : "right"}</li>
              </ol>
            </div>
            <div style={S.card}>
              <p style={S.label}>Your check-in QR</p>
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                <QRCode value={`${API}/api/patient/${patient?.id}`} size={140}/>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Show this at the desk if needed</p>
            </div>
            <button onClick={() => setStep(3)} style={S.btn}>I've arrived → Show my queue position</button>
          </div>
        )}

        {/* ── Step 3: Queue ── */}
        {step === 3 && (
          <div style={S.section}>
            <div style={S.card}>
              <p style={S.label}>Your position</p>
              <div style={S.posNum}>{queuePos}</div>
              <p style={{ color: "#64748b", fontSize: 14 }}>in line at {dept?.name}</p>
              <div style={S.divider}/>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>
                Estimated wait: <strong style={{ color: "#334155" }}>{Math.max(1, queuePos * 3)} min</strong>
              </p>
              <div style={S.bar}>
                <div style={{ ...S.fill, width: `${Math.max(5, 100 - queuePos * 15)}%` }}/>
              </div>
            </div>
            <div style={{ ...S.card, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
              <p style={{ fontSize: 13, color: "#0369a1", margin: 0 }}>
                💬 We'll alert you when it's almost your turn. You don't need to stay glued to this screen.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Being called ── */}
        {step === 4 && (
          <div style={S.section}>
            <div style={{ ...S.card, background: "#f0fdf4", border: "2px solid #4ade80", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔔</div>
              <h2 style={{ margin: 0, color: "#15803d" }}>It's your turn!</h2>
              <p style={{ color: "#166534", fontSize: 14 }}>Please head to Room {dept?.room} now</p>
            </div>
            <div style={S.card}>
              <p style={S.label}>What to expect</p>
              <ol style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 14, lineHeight: 1.8 }}>
                <li>Show your QR code or give your name at the desk</li>
                <li>A nurse will take your vitals</li>
                <li>A doctor will see you shortly after</li>
                <li>Average visit time: {dept?.wait} minutes</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Step 5: Discharge ── */}
        {step === 5 && (
          <div style={S.section}>
            <div style={{ ...S.card, background: "#f0fdf4", border: "2px solid #4ade80" }}>
              <h2 style={{ margin: 0, color: "#15803d" }}>You're all set! 🎉</h2>
              <p style={{ color: "#166534", fontSize: 14 }}>Thank you for visiting ClearPath</p>
            </div>
            {discharge && (
              <div style={S.card}>
                <p style={S.label}>Discharge instructions</p>
                <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{discharge}</p>
              </div>
            )}
            {!followUp ? (
              <button onClick={handleFollowUp} disabled={loading} style={S.btn}>
                {loading ? "Generating…" : "Get follow-up reminder →"}
              </button>
            ) : (
              <div style={{ ...S.card, background: "#fefce8", border: "1px solid #fde047" }}>
                <p style={S.label}>Your 3-day follow-up reminder</p>
                <p style={{ fontSize: 14, color: "#713f12", lineHeight: 1.7 }}>{followUp}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:     { fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" },
  header:   { display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 12px", borderBottom: "1px solid #e2e8f0", background: "#fff" },
  logo:     { fontSize: 22, color: "#3B8BD4", fontWeight: 700 },
  title:    { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" },
  langSel:  { border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 8px", fontSize: 13 },
  body:     { padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  section:  { display: "flex", flexDirection: "column", gap: 12 },
  heading:  { fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a" },
  sub:      { fontSize: 14, color: "#64748b", margin: 0 },
  label:    { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" },
  textarea: { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, resize: "none", fontFamily: "inherit" },
  input:    { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", marginBottom: 8 },
  btn:      { padding: "13px 20px", borderRadius: 10, border: "none", background: "#3B8BD4", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
  ghost:    { padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", fontSize: 14, cursor: "pointer" },
  card:     { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" },
  deptName: { fontSize: 22, fontWeight: 700, margin: "4px 0", color: "#0f172a" },
  posNum:   { fontSize: 64, fontWeight: 800, color: "#3B8BD4", lineHeight: 1 },
  divider:  { height: 1, background: "#f1f5f9", margin: "10px 0" },
  bar:      { height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginTop: 6 },
  fill:     { height: "100%", background: "#3B8BD4", borderRadius: 99, transition: "width 1s ease" },
  badge:    { alignSelf: "flex-start", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600, marginTop: 8 },
};