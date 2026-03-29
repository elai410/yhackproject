export default function Intake({ situation, setSituation, ui, loading, onSubmit }) {
  return (
    <div style={S.section}>
      <h2 style={S.heading}>{ui.heading}</h2>
      <p style={S.sub}>{ui.sub}</p>
      <textarea
        value={situation}
        onChange={e => setSituation(e.target.value)}
        placeholder="…"
        rows={3}
        style={S.textarea}
      />
      <button onClick={onSubmit} disabled={loading} style={S.btn}>
        {loading ? "…" : ui.btn_route}
      </button>
    </div>
  );
}

const S = {
  section:  { display: "flex", flexDirection: "column", gap: 12 },
  heading:  { fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a" },
  sub:      { fontSize: 14, color: "#64748b", margin: 0 },
  textarea: { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, resize: "none", fontFamily: "inherit" },
  btn:      { padding: "13px 20px", borderRadius: 10, border: "none", background: "#3B8BD4", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
};