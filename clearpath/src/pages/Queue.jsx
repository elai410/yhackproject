export default function Queue({ queuePos, dept, ui }) {
  const waitMins = Math.max(1, queuePos * 3);
  const fillPct  = Math.max(5, 100 - queuePos * 15);

  return (
    <div style={S.section}>
      <div style={S.card}>
        <p style={S.label}>{ui.label_position}</p>
        <div style={S.posNum}>{queuePos}</div>
        <p style={{ color: "#64748b", fontSize: 14 }}>{ui.label_queue} {dept?.name}</p>
        <div style={S.divider}/>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          {ui.label_wait}: <strong style={{ color: "#334155" }}>{waitMins} {ui.min}</strong>
        </p>
        <div style={S.bar}>
          <div style={{ ...S.fill, width: `${fillPct}%` }}/>
        </div>
      </div>

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
};