export default function Discharge({ discharge, followUp, ui, loading, onFollowUp }) {
  return (
    <div style={S.section}>
      <div style={{ ...S.card, background: "#f0fdf4", border: "2px solid #4ade80" }}>
        <h2 style={{ margin: 0, color: "#15803d" }}>{ui.allset}</h2>
        <p style={{ color: "#166534", fontSize: 14, margin: "6px 0 0" }}>{ui.thank_you}</p>
      </div>

      {discharge && (
        <div style={S.card}>
          <p style={S.label}>{ui.label_discharge}</p>
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: 0 }}>{discharge}</p>
        </div>
      )}

      {!followUp ? (
        <button onClick={onFollowUp} disabled={loading} style={S.btn}>
          {loading ? "…" : ui.btn_followup}
        </button>
      ) : (
        <div style={{ ...S.card, background: "#fefce8", border: "1px solid #fde047" }}>
          <p style={S.label}>{ui.label_followup_card}</p>
          <p style={{ fontSize: 14, color: "#713f12", lineHeight: 1.7, margin: 0 }}>{followUp}</p>
        </div>
      )}
    </div>
  );
}

const S = {
  section: { display: "flex", flexDirection: "column", gap: 12 },
  card:    { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" },
  label:   { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" },
  btn:     { padding: "13px 20px", borderRadius: 10, border: "none", background: "#3B8BD4", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
};