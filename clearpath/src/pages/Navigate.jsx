import { QRCodeSVG as QRCode } from "qrcode.react";
import FloorPlan from "../components/FloorPlan.jsx";
import { API_URL } from "../api/backend.js";

export default function Navigate({ dept, patient, ui, onArrived }) {
  return (
    <div style={S.section}>
      <div style={S.card}>
        <p style={S.label}>{ui.label_routed}</p>
        <h2 style={S.deptName}>{dept.name}</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Floor {dept.floor} · Room {dept.room}</p>
      </div>

      <FloorPlan activeRoom={dept.id} />

      <div style={S.card}>
        <p style={S.label}>{ui.label_directions}</p>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 14, lineHeight: 1.8 }}>
          {ui.directions.map((d, i) => <li key={i}>{d}</li>)}
        </ol>
      </div>

      <div style={S.card}>
        <p style={S.label}>{ui.label_qr}</p>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
          <QRCode value={`${API_URL}/api/patient/${patient?.id}`} size={140}/>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: 0 }}>
          Show this at the desk if needed
        </p>
      </div>

      <button onClick={onArrived} style={S.btn}>{ui.btn_arrived}</button>
    </div>
  );
}

const S = {
  section:  { display: "flex", flexDirection: "column", gap: 12 },
  card:     { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" },
  label:    { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" },
  deptName: { fontSize: 22, fontWeight: 700, margin: "4px 0", color: "#0f172a" },
  btn:      { padding: "13px 20px", borderRadius: 10, border: "none", background: "#3B8BD4", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
};