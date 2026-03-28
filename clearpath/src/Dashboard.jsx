import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001";
const WS  = "ws://localhost:3001";

const DEPT_COLORS = {
  rabies:    { bg: "#e0f2fe", border: "#38bdf8", text: "#0369a1" },
  emergency: { bg: "#fee2e2", border: "#f87171", text: "#b91c1c" },
  pediatric: { bg: "#fef9c3", border: "#facc15", text: "#a16207" },
  triage:    { bg: "#dcfce7", border: "#4ade80", text: "#15803d" },
};

const URGENCY_COLORS = {
  high:   { bg: "#fee2e2", text: "#b91c1c" },
  medium: { bg: "#fef9c3", text: "#a16207" },
  low:    { bg: "#dcfce7", text: "#15803d" },
};

const DEPARTMENTS = ["rabies", "emergency", "pediatric", "triage"];
const DEPT_NAMES  = {
  rabies:    "Rabies Clinic",
  emergency: "Emergency Room",
  pediatric: "Pediatric ER",
  triage:    "General Triage",
};

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + "Z")) / 1000 / 60);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} min ago`;
}

function PatientCard({ patient, onCallNext, onDischarge, onMove }) {
  const [showDischarge, setShowDischarge] = useState(false);
  const [instructions, setInstructions]   = useState("");
  const [showMove, setShowMove]           = useState(false);
  const [moveDept, setMoveDept]           = useState("");
  const c = DEPT_COLORS[patient.department] || DEPT_COLORS.triage;
  const u = URGENCY_COLORS[patient.urgency] || URGENCY_COLORS.low;

  return (
    <div style={{ ...S.patientCard, borderLeft: `4px solid ${c.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={S.patientName}>{patient.name}</span>
            <span style={{ ...S.badge, background: u.bg, color: u.text }}>{patient.urgency}</span>
            {patient.status === "called" && (
              <span style={{ ...S.badge, background: "#ede9fe", color: "#6d28d9" }}>called</span>
            )}
          </div>
          <p style={S.situation}>{patient.situation}</p>
          <p style={S.meta}>Room {patient.room} · Floor {patient.floor} · #{patient.queue_position} in queue · {timeSince(patient.checked_in_at)}</p>
          {patient.language !== "en" && (
            <span style={{ ...S.badge, background: "#f0f9ff", color: "#0369a1", marginTop: 4 }}>
              {patient.language.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 12px", fontStyle: "italic" }}>{patient.reason}</p>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {patient.status === "waiting" && (
          <button onClick={() => onCallNext(patient.department)} style={S.actionBtn}>
            📣 Call next
          </button>
        )}
        <button onClick={() => setShowMove(!showMove)} style={S.ghostBtn}>
          ↪ Move dept
        </button>
        <button onClick={() => setShowDischarge(!showDischarge)} style={{ ...S.ghostBtn, color: "#15803d" }}>
          ✓ Discharge
        </button>
      </div>

      {/* Move department */}
      {showMove && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <select value={moveDept} onChange={e => setMoveDept(e.target.value)} style={S.select}>
            <option value="">Select department…</option>
            {DEPARTMENTS.filter(d => d !== patient.department).map(d => (
              <option key={d} value={d}>{DEPT_NAMES[d]}</option>
            ))}
          </select>
          <button onClick={() => { onMove(patient.id, moveDept); setShowMove(false); }} style={S.actionBtn}>
            Move
          </button>
        </div>
      )}

      {/* Discharge with instructions */}
      {showDischarge && (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Discharge instructions for patient…"
            rows={3}
            style={S.textarea}
          />
          <button onClick={() => { onDischarge(patient.id, instructions); setShowDischarge(false); }} style={{ ...S.actionBtn, marginTop: 8 }}>
            Confirm discharge
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchPatients();
    const ws = new WebSocket(`${WS}?id=dashboard`);
    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "QUEUE_UPDATED" || msg.type === "PATIENT_JOINED") {
        setPatients(msg.queue || []);
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  function fetchPatients() {
    fetch(`${API}/api/patients`)
      .then(r => r.json())
      .then(setPatients)
      .catch(() => {});
  }

  async function handleCallNext(department) {
    await fetch(`${API}/api/call-next/${department}`, { method: "POST" });
    fetchPatients();
  }

  async function handleDischarge(id, instructions) {
    await fetch(`${API}/api/discharge/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructions }),
    });
    fetchPatients();
  }

  async function handleMove(id, department) {
    if (!department) return;
    const deptData = { rabies: { room: "A3", floor: "1" }, emergency: { room: "B1", floor: "2" }, pediatric: { room: "B4", floor: "2" }, triage: { room: "A1", floor: "1" } };
    const d = deptData[department] || { room: "A1", floor: "1" };
    await fetch(`${API}/api/move/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department, room: d.room, floor: d.floor, reason: `Transferred to ${DEPT_NAMES[department]}` }),
    });
    fetchPatients();
  }

  const filtered = patients.filter(p => {
    if (filter !== "all" && p.department !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.situation.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = DEPARTMENTS.map(d => ({
    id: d,
    name: DEPT_NAMES[d],
    count: patients.filter(p => p.department === d).length,
    high: patients.filter(p => p.department === d && p.urgency === "high").length,
  }));

  return (
    <div style={S.root}>
      <header style={S.header}>
        <span style={S.logo}>＋</span>
        <h1 style={S.title}>ClearPath — Staff Dashboard</h1>
        <div style={{ ...S.dot, background: connected ? "#4ade80" : "#f87171" }}/>
        <span style={{ fontSize: 12, color: connected ? "#15803d" : "#b91c1c" }}>
          {connected ? "Live" : "Disconnected"}
        </span>
      </header>

      {/* Stats row */}
      <div style={S.statsRow}>
        {stats.map(s => {
          const c = DEPT_COLORS[s.id];
          return (
            <div key={s.id} style={{ ...S.statCard, borderTop: `3px solid ${c.border}`, cursor: "pointer", background: filter === s.id ? c.bg : "#fff" }}
              onClick={() => setFilter(filter === s.id ? "all" : s.id)}>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.text }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.name}</div>
              {s.high > 0 && <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>⚠ {s.high} high urgency</div>}
            </div>
          );
        })}
      </div>

      {/* Search + filter */}
      <div style={S.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search patients…" style={S.search}/>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={S.select}>
          <option value="all">All departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPT_NAMES[d]}</option>)}
        </select>
        <button onClick={fetchPatients} style={S.refreshBtn}>↻ Refresh</button>
      </div>

      {/* Patient list */}
      <div style={S.list}>
        {filtered.length === 0 ? (
          <div style={S.empty}>No patients currently waiting</div>
        ) : (
          filtered.map(p => (
            <PatientCard
              key={p.id}
              patient={p}
              onCallNext={handleCallNext}
              onDischarge={handleDischarge}
              onMove={handleMove}
            />
          ))
        )}
      </div>
    </div>
  );
}

const S = {
  root:       { fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" },
  header:     { display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#fff" },
  logo:       { fontSize: 22, color: "#3B8BD4", fontWeight: 700 },
  title:      { flex: 1, fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" },
  dot:        { width: 8, height: 8, borderRadius: "50%" },
  statsRow:   { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "20px 24px 0" },
  statCard:   { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  toolbar:    { display: "flex", gap: 12, padding: "16px 24px", alignItems: "center" },
  search:     { flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit" },
  select:     { padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit" },
  refreshBtn: { padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, cursor: "pointer" },
  list:       { padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 12 },
  empty:      { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
  patientCard:{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  patientName:{ fontSize: 16, fontWeight: 700, color: "#0f172a" },
  situation:  { fontSize: 14, color: "#334155", margin: "4px 0 2px" },
  meta:       { fontSize: 12, color: "#94a3b8", margin: 0 },
  badge:      { borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  actionBtn:  { padding: "7px 14px", borderRadius: 8, border: "none", background: "#3B8BD4", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn:   { padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer" },
  textarea:   { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "none", fontFamily: "inherit" },
};