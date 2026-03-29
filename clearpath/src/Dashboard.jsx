import { useState, useEffect, useRef } from "react";
import PatientCard from "./components/PatientCard.jsx";
import { fetchAllPatients, callNext, dischargePatient, movePatient, DEPT_ROOM, WS_URL } from "./api/backend.js";
import { DEPT_COLORS, DEPT_LIST, DEPT_NAMES } from "./constants.js";

export default function Dashboard() {
  const [patients, setPatients]   = useState([]);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    loadPatients();
    const ws = new WebSocket(`${WS_URL}?id=dashboard`);
    ws.onopen    = () => setConnected(true);
    ws.onclose   = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "QUEUE_UPDATED" || msg.type === "PATIENT_JOINED") loadPatients();
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  function loadPatients() {
    fetchAllPatients().then(setPatients).catch(() => {});
  }

  async function handleCallNext(department) {
    await callNext(department);
    loadPatients();
  }

  async function handleDischarge(id, instructions) {
    await dischargePatient(id, instructions);
    loadPatients();
  }

  async function handleMove(id, department) {
    if (!department) return;
    const d = DEPT_ROOM[department] || { room: "East Pavilion", floor: "1" };
    await movePatient(id, department, d.room, d.floor);
    loadPatients();
  }

  const filtered = patients.filter(p => {
    if (filter !== "all" && p.department !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.situation.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = DEPT_LIST.map(d => ({
    id: d,
    name: DEPT_NAMES[d],
    count: patients.filter(p => p.department === d).length,
    high:  patients.filter(p => p.department === d && p.urgency === "high").length,
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

      {/* Stats grid — scrollable row */}
      <div style={S.statsRow}>
        {stats.map(s => {
          const c = DEPT_COLORS[s.id] || { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" };
          return (
            <div key={s.id}
              onClick={() => setFilter(filter === s.id ? "all" : s.id)}
              style={{ ...S.statCard, borderTop: `3px solid ${c.border}`, cursor: "pointer", background: filter === s.id ? c.bg : "#fff" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.text }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, lineHeight: 1.3 }}>{s.name}</div>
              {s.high > 0 && <div style={{ fontSize: 10, color: "#b91c1c", marginTop: 2 }}>⚠ {s.high} high</div>}
            </div>
          );
        })}
      </div>

      <div style={S.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search patients…" style={S.search}/>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={S.select}>
          <option value="all">All departments</option>
          {DEPT_LIST.map(d => <option key={d} value={d}>{DEPT_NAMES[d]}</option>)}
        </select>
        <button onClick={loadPatients} style={S.refreshBtn}>↻</button>
      </div>

      <div style={S.list}>
        {filtered.length === 0 ? (
          <div style={S.empty}>No patients currently waiting</div>
        ) : (
          filtered.map(p => (
            <PatientCard key={p.id} patient={p}
              onCallNext={handleCallNext}
              onDischarge={handleDischarge}
              onMove={handleMove}/>
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
  statsRow:   { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, padding: "20px 24px 0" },
  statCard:   { background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  toolbar:    { display: "flex", gap: 12, padding: "16px 24px", alignItems: "center" },
  search:     { flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit" },
  select:     { padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit" },
  refreshBtn: { padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 16, cursor: "pointer" },
  list:       { padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 12 },
  empty:      { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
};