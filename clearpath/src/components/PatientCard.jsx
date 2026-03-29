import { useState } from "react";
import { DEPT_COLORS, DEPT_LIST, DEPT_NAMES } from "../constants.js";
import { updateStatus, STATUS_LABELS, STATUS_COLORS } from "../api/backend.js";

const URGENCY_COLORS = {
  high:   { bg: "#fee2e2", text: "#b91c1c" },
  medium: { bg: "#fef9c3", text: "#a16207" },
  low:    { bg: "#dcfce7", text: "#15803d" },
};

const SENTIMENT_STYLES = {
  calm:       { bg: "#dcfce7", color: "#15803d", icon: "😌" },
  anxious:    { bg: "#fef9c3", color: "#a16207", icon: "😟" },
  scared:     { bg: "#fee2e2", color: "#b91c1c", icon: "😨" },
  confused:   { bg: "#f3e8ff", color: "#7e22ce", icon: "😕" },
  distressed: { bg: "#fee2e2", color: "#b91c1c", icon: "😰" },
  "in-pain":  { bg: "#ffedd5", color: "#c2410c", icon: "😣" },
};

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + "Z")) / 1000 / 60);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} min ago`;
}

export default function PatientCard({ patient, onCallNext, onDischarge, onMove, onRefresh }) {
  const [showDischarge, setShowDischarge] = useState(false);
  const [instructions, setInstructions]   = useState("");
  const [showMove, setShowMove]           = useState(false);
  const [moveDept, setMoveDept]           = useState("");
  const [expanded, setExpanded]           = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const c  = DEPT_COLORS[patient.department] || DEPT_COLORS.triage;
  const u  = URGENCY_COLORS[patient.urgency] || URGENCY_COLORS.low;
  const s  = SENTIMENT_STYLES[patient.sentiment] || null;
  const sc = STATUS_COLORS[patient.status] || STATUS_COLORS.waiting;
  const isStuck = patient.is_stuck;

  async function handleStatusChange(newStatus) {
    setUpdatingStatus(true);
    try {
      await updateStatus(patient.id, newStatus);
      onRefresh();
    } catch {}
    setUpdatingStatus(false);
  }

  return (
    <div style={{
      ...S.card,
      borderLeft: `4px solid ${isStuck ? "#f87171" : c.border}`,
      background: isStuck ? "#fff8f8" : "#fff",
    }}>

      {/* Stuck banner */}
      {isStuck && (
        <div style={S.stuckBanner}>
          ⚠ Waiting {patient.wait_minutes} min — needs attention
        </div>
      )}

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={S.name}>{patient.name}</span>
            <span style={{ ...S.badge, background: u.bg, color: u.text }}>{patient.urgency}</span>
            <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>
              {STATUS_LABELS[patient.status] || patient.status}
            </span>
            {s && (
              <span style={{ ...S.badge, background: s.bg, color: s.color }}>
                {s.icon} {patient.sentiment}
              </span>
            )}
          </div>

          {patient.sentimentNote && (
            <p style={{ fontSize: 12, color: "#7e22ce", margin: "4px 0 0", fontStyle: "italic" }}>
              "{patient.sentimentNote}"
            </p>
          )}

          {patient.summary && (
            <p style={{ fontSize: 13, color: "#334155", margin: "6px 0 2px", lineHeight: 1.5 }}>
              {patient.summary}
            </p>
          )}

          <p style={S.meta}>
            {DEPT_NAMES[patient.department]} · {patient.room} · #{patient.queue_position} · {timeSince(patient.checked_in_at)}
          </p>

          {patient.language && patient.language !== "English" && (
            <span style={{ ...S.badge, background: "#f0f9ff", color: "#0369a1", marginTop: 4, display: "inline-block" }}>
              {patient.language}
            </span>
          )}
        </div>

        <button onClick={() => setExpanded(!expanded)} style={S.expandBtn}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={S.expandedDetail}>
          <p style={S.detailLabel}>Original situation</p>
          <p style={{ fontSize: 13, color: "#334155", margin: "0 0 8px", lineHeight: 1.6 }}>{patient.situation}</p>
          <p style={S.detailLabel}>Triage reason</p>
          <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>{patient.reason}</p>
        </div>
      )}

      {/* Status update row */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Status:</span>
        <select
          value={patient.status}
          onChange={e => handleStatusChange(e.target.value)}
          disabled={updatingStatus}
          style={{ ...S.select, flex: 1, fontSize: 13 }}>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {patient.status === "waiting" && (
          <button onClick={() => onCallNext(patient.department)} style={S.actionBtn}>
            📣 Call next
          </button>
        )}
        <button onClick={() => setShowMove(!showMove)} style={S.ghostBtn}>↪ Move</button>
        <button onClick={() => setShowDischarge(!showDischarge)} style={{ ...S.ghostBtn, color: "#15803d" }}>
          ✓ Discharge
        </button>
      </div>

      {showMove && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
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
        <div style={{ marginTop: 10 }}>
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
  card:          { borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  stuckBanner:   { background: "#fee2e2", color: "#b91c1c", fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 6, marginBottom: 10 },
  name:          { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  meta:          { fontSize: 12, color: "#94a3b8", margin: "4px 0 0" },
  badge:         { borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  expandBtn:     { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, padding: "4px 8px" },
  expandedDetail:{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", marginTop: 10 },
  detailLabel:   { fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" },
  actionBtn:     { padding: "7px 14px", borderRadius: 8, border: "none", background: "#3B8BD4", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn:      { padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer" },
  select:        { padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", background: "#fff" },
  textarea:      { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "none", fontFamily: "inherit" },
};