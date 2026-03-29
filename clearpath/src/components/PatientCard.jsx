import { useState } from "react";
import { DEPT_COLORS, DEPT_LIST, DEPT_NAMES } from "../constants.js";

const URGENCY_COLORS = {
  high:   { bg: "#fee2e2", text: "#b91c1c" },
  medium: { bg: "#fef9c3", text: "#a16207" },
  low:    { bg: "#dcfce7", text: "#15803d" },
};

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + "Z")) / 1000 / 60);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} min ago`;
}

export default function PatientCard({ patient, onCallNext, onDischarge, onMove }) {
  const [showDischarge, setShowDischarge] = useState(false);
  const [instructions, setInstructions]   = useState("");
  const [showMove, setShowMove]           = useState(false);
  const [moveDept, setMoveDept]           = useState("");

  const c = DEPT_COLORS[patient.department] || DEPT_COLORS.triage;
  const u = URGENCY_COLORS[patient.urgency] || URGENCY_COLORS.low;

  return (
    <div style={{ ...S.card, borderLeft: `4px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={S.name}>{patient.name}</span>
            <span style={{ ...S.badge, background: u.bg, color: u.text }}>{patient.urgency}</span>
            {patient.status === "called" && (
              <span style={{ ...S.badge, background: "#ede9fe", color: "#6d28d9" }}>called</span>
            )}
          </div>
          <p style={S.situation}>{patient.situation}</p>
          <p style={S.meta}>
            Room {patient.room} · Floor {patient.floor} · #{patient.queue_position} in queue · {timeSince(patient.checked_in_at)}
          </p>
          {patient.language && patient.language !== "English" && (
            <span style={{ ...S.badge, background: "#f0f9ff", color: "#0369a1", marginTop: 4, display: "inline-block" }}>
              {patient.language}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 12px", fontStyle: "italic" }}>
        {patient.reason}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {patient.status === "waiting" && (
          <button onClick={() => onCallNext(patient.department)} style={S.actionBtn}>
            📣 Call next
          </button>
        )}
        <button onClick={() => setShowMove(!showMove)} style={S.ghostBtn}>↪ Move dept</button>
        <button onClick={() => setShowDischarge(!showDischarge)} style={{ ...S.ghostBtn, color: "#15803d" }}>
          ✓ Discharge
        </button>
      </div>

      {showMove && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <select value={moveDept} onChange={e => setMoveDept(e.target.value)} style={S.select}>
            <option value="">Select department…</option>
            {DEPT_LIST.filter(d => d !== patient.department).map(d => (
              <option key={d} value={d}>{DEPT_NAMES[d]}</option>
            ))}
          </select>
          <button onClick={() => { onMove(patient.id, moveDept); setShowMove(false); }} style={S.actionBtn}>
            Move
          </button>
        </div>
      )}

      {showDischarge && (
        <div style={{ marginTop: 12 }}>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
            placeholder="Discharge instructions for patient…" rows={3} style={S.textarea}/>
          <button onClick={() => { onDischarge(patient.id, instructions); setShowDischarge(false); }}
            style={{ ...S.actionBtn, marginTop: 8 }}>
            Confirm discharge
          </button>
        </div>
      )}
    </div>
  );
}

const S = {
  card:      { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  name:      { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  situation: { fontSize: 14, color: "#334155", margin: "4px 0 2px" },
  meta:      { fontSize: 12, color: "#94a3b8", margin: 0 },
  badge:     { borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  actionBtn: { padding: "7px 14px", borderRadius: 8, border: "none", background: "#3B8BD4", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn:  { padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer" },
  select:    { padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit" },
  textarea:  { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "none", fontFamily: "inherit" },
};