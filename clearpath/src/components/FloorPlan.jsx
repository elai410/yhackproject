export default function FloorPlan({ activeRoom }) {
  const rooms = [
    { id: "triage",   label: "Triage A1", x: 60,  y: 80,  w: 140, h: 80 },
    { id: "rabies",   label: "Rabies A3", x: 60,  y: 200, w: 140, h: 80 },
    { id: "pharmacy", label: "Pharmacy",  x: 280, y: 80,  w: 120, h: 80 },
    { id: "waiting",  label: "Waiting",   x: 280, y: 200, w: 120, h: 80 },
    { id: "entrance", label: "Entrance",  x: 170, y: 340, w: 100, h: 50 },
  ];
  const paths = {
    triage:   "M220,340 L220,300 L130,300 L130,160",
    rabies:   "M220,340 L220,300 L130,300 L130,280",
    pharmacy: "M220,340 L220,300 L340,300 L340,160",
    waiting:  "M220,340 L220,300 L340,300 L340,280",
  };
  return (
    <svg width="100%" viewBox="0 0 480 420" style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <rect x="40" y="290" width="400" height="20" rx="4" fill="#f0f0f0" stroke="#ccc" strokeWidth="0.5"/>
      <rect x="230" y="60" width="20" height="250" rx="4" fill="#f0f0f0" stroke="#ccc" strokeWidth="0.5"/>
      {rooms.map((r) => (
        <g key={r.id}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8"
            fill={r.id === activeRoom ? "#3B8BD4" : "#e8f4fd"}
            stroke={r.id === activeRoom ? "#185FA5" : "#aacde8"}
            strokeWidth={r.id === activeRoom ? 2 : 0.5}/>
          <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="central"
            fontSize="13" fontWeight={r.id === activeRoom ? 600 : 400}
            fill={r.id === activeRoom ? "#fff" : "#185FA5"}>
            {r.label}
          </text>
        </g>
      ))}
      {activeRoom && paths[activeRoom] && (
        <path d={paths[activeRoom]} fill="none" stroke="#3B8BD4" strokeWidth="3"
          strokeDasharray="8 4" strokeLinecap="round" markerEnd="url(#arrow)"
          style={{ animation: "dash 1.2s linear infinite" }}/>
      )}
      <style>{`@keyframes dash { to { stroke-dashoffset: -24; } }`}</style>
    </svg>
  );
}