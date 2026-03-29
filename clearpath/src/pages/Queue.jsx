import { useEffect, useState } from "react";
import { fetchPatient } from "../api/backend.js";

const STATUS_MESSAGES = {
  waiting: {
    icon: "🕐",
    title: "You're in the queue",
    color: "#0369a1",
    bg: "#e0f2fe",
  },
  in_progress: {
    icon: "🩺",
    title: "You're being seen",
    message: "A member of the care team is with you now.",
    color: "#15803d",
    bg: "#dcfce7",
  },
  pending_test: {
    icon: "🔬",
    title: "Test in progress",
    message: "Your test is underway. We'll update you as soon as results are ready.",
    color: "#0369a1",
    bg: "#e0f2fe",
  },
  pending_signature: {
    icon: "📋",
    title: "Awaiting sign-off",
    message: "A doctor is reviewing your paperwork. This usually takes a few minutes.",
    color: "#a16207",
    bg: "#fef9c3",
  },
  pending_transport: {
    icon: "🚑",
    title: "Transport arranged",
    message: "Transport is on the way to you. Please stay where you are.",
    color: "#7e22ce",
    bg: "#f3e8ff",
  },
  pending_bed: {
    icon: "🛏",
    title: "Room being prepared",
    message: "We're getting your room ready. Thank you for your patience.",
    color: "#c2410c",
    bg: "#ffedd5",
  },
  called: {
    icon: "🔔",
    title: "You've been called!",
    message: "Please head to the desk now.",
    color: "#6d28d9",
    bg: "#ede9fe",
  },
};

export default function Queue({ queuePos, dept, ui, patientId }) {
  const [status, setStatus]         = useState("waiting");
  const [statusMessage, setStatusMessage] = useState(null);

  // Poll for status updates every 20 seconds
  useEffect(() => {
    if (!patientId) return;
    const poll = async () => {
      try {
        const p = await fetchPatient(patientId);
        setStatus(p.status || "waiting");
      } catch {}
    };
    poll();
    const t = setInterval(poll, 20000);
    return () => clearInterval(t);
  }, [patientId]);

  // Listen for WebSocket STATUS_UPDATE messages
  useEffect(() => {
    const handler = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "STATUS_UPDATE") {
          setStatus(msg.status);
          setStatusMessage(msg.message);
          setTimeout(() => setStatusMessage(null), 8000);
        }
      } catch {}
    };
    window.addEventListener("ws-message", handler);
    return () => window.removeEventListener("ws-message", handler);
  }, []);

  const waitMins = Math.max(1, queuePos * 3);
  const fillPct  = Math.max(5, 100 - queuePos * 15);
  const statusInfo = STATUS_MESSAGES[status] || STATUS_MESSAGES.waiting;
  const isWaiting  = status === "waiting";

  return (
    <div style={S.section}>

      {/* Status card */}
      <div style={{ ...S.card, background: statusInfo.bg, border: `1px solid ${statusInfo.color}30` }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>{statusInfo.icon}</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: statusInfo.color }}>
          {statusInfo.title}
        </h2>
        {statusInfo.message && (
          <p style={{ color: statusInfo.color, fontSize: 14, margin: "6px 0 0", opacity: 0.9 }}>
            {statusInfo.message}
          </p>
        )}
      </div>

      {/* Toast notification for live status update */}
      {statusMessage && (
        <div style={S.toast}>
          🔔 {statusMessage}
        </div>
      )}

      {/* Queue position — only show when waiting */}
      {isWaiting && (
        <div style={S.card}>
          <p style={S.label}>{ui.label_position}</p>
          <div style={S.posNum}>{queuePos}</div>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0" }}>
            {ui.label_queue} {dept?.name}
          </p>
          <div style={S.divider}/>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {ui.label_wait}: <strong style={{ color: "#334155" }}>{waitMins} {ui.min}</strong>
          </p>
          <div style={S.bar}>
            <div style={{ ...S.fill, width: `${fillPct}%` }}/>
          </div>
        </div>
      )}

      <div style={{ ...S.card, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
        <p style={{ fontSize: 13, color: "#0369a1", margin: 0 }}>
          💬 {ui.alert_wait_msg}
        </p>
      </div>
    </div>
  );
}

const S = {
  section: { display: "flex", flexDirection: "column", gap: 12 },
  card:    { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" },
  label:   { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" },
  posNum:  { fontSize: 64, fontWeight: 800, color: "#3B8BD4", lineHeight: 1 },
  divider: { height: 1, background: "#f1f5f9", margin: "10px 0" },
  bar:     { height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginTop: 6 },
  fill:    { height: "100%", background: "#3B8BD4", borderRadius: 99, transition: "width 1s ease" },
  toast:   { background: "#1e293b", color: "#fff", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 500 },
};