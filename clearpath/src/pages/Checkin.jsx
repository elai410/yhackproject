import { urgencyColor } from "../constants.js";

export default function Checkin({ dept, patient, name, setName, phone, setPhone, ui, loading, onCheckin, onBack }) {
  return (
    <div style={S.section}>
      <div style={{ ...S.card, borderLeft: "4px solid #3B8BD4" }}>
        <p style={S.label}>{ui.label_routed}</p>
        <h2 style={S.deptName}>{dept.name}</h2>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0" }}>
          Floor {dept.floor} · Room {dept.room}
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>{patient.reason}</p>
        <span style={{ ...S.badge, background: urgencyColor(patient.urgency) }}>
          {patient.urgency} {ui.urgency_label}
        </span>
      </div>

      <div style={S.card}>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder={ui.label_name} style={S.input}/>
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder={ui.label_phone} style={S.input} type="tel"/>
      </div>

      <button onClick={onCheckin} disabled={loading} style={S.btn}>
        {loading ? "…" : ui.btn_checkin}
      </button>
      <button onClick={onBack} style={S.ghost}>{ui.back}</button>
    </div>
  );
}

const S = {
  section:  { display: "flex", flexDirection: "column", gap: 12 },
  card:     { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" },
  label:    { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" },
  deptName: { fontSize: 22, fontWeight: 700, margin: "4px 0", color: "#0f172a" },
  badge:    { alignSelf: "flex-start", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600, marginTop: 8 },
  input:    { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", marginBottom: 8 },
  btn:      { padding: "13px 20px", borderRadius: 10, border: "none", background: "#3B8BD4", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
  ghost:    { padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", fontSize: 14, cursor: "pointer" },
};