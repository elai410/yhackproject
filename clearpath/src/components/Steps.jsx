const STEP_LABELS = ["Intake", "Check-in", "Navigate", "Queue", "Care", "Discharge"];

export default function Steps({ current }) {
  return (
    <div style={{ display: "flex", marginBottom: 24 }}>
      {STEP_LABELS.map((s, i) => (
        <div key={s} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px",
            background: i < current ? "#3B8BD4" : i === current ? "#185FA5" : "#e2e8f0",
            color: i <= current ? "#fff" : "#94a3b8",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600,
          }}>
            {i < current ? "✓" : i + 1}
          </div>
          <div style={{ fontSize: 10, color: i === current ? "#185FA5" : "#94a3b8", fontWeight: i === current ? 600 : 400 }}>
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}