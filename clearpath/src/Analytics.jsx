import { useState, useEffect } from "react";
import { DEPT_COLORS, DEPT_NAMES } from "./constants.js";

const API = "http://localhost:3001";

const URGENCY = {
  high:   { color: "#f87171", label: "High" },
  medium: { color: "#facc15", label: "Medium" },
  low:    { color: "#4ade80", label: "Low" },
};

function StatCard({ value, label, sub, color }) {
  return (
    <div style={{ ...S.statCard, borderTop: `3px solid ${color || "#3B8BD4"}` }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || "#3B8BD4", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, color }) {
  if (!data || data.length === 0) return <div style={S.empty}>No data yet</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, padding: "0 4px" }}>
      {Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, "0");
        const found = data.find(d => d.hour === hour);
        const count = found ? found.count : 0;
        const height = Math.max(2, (count / max) * 90);
        return (
          <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div title={`${count} patients`} style={{
              width: "100%", height,
              background: count > 0 ? color || "#3B8BD4" : "#e2e8f0",
              borderRadius: "3px 3px 0 0",
              transition: "height 0.3s ease",
            }}/>
            {i % 6 === 0 && (
              <span style={{ fontSize: 9, color: "#94a3b8" }}>{hour}h</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = Math.max(2, (value / Math.max(max, 1)) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#334155", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "#64748b" }}>{value} min avg</span>
      </div>
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }}/>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const res = await fetch(`${API}/api/analytics`);
      setData(await res.json());
    } catch {}
    setLoading(false);
  }

  if (loading) return <div style={S.loading}>Loading analytics…</div>;
  if (!data)   return <div style={S.loading}>Could not load data</div>;

  const maxWait = Math.max(...(data.avgWaitByDept || []).map(d => d.avg_wait_minutes || 0), 1);
  const totalUrgency = (data.urgencyBreakdown || []).reduce((s, u) => s + u.count, 0);

  return (
    <div style={S.root}>
      <header style={S.header}>
        <span style={S.logo}>＋</span>
        <h1 style={S.title}>ClearPath — Analytics</h1>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>Auto-refreshes every 15s</span>
      </header>

      <div style={S.body}>

        {/* Top stats */}
        <div style={S.grid4}>
          <StatCard value={data.totalToday}      label="Patients today"      color="#3B8BD4"/>
          <StatCard value={data.currentlyWaiting} label="Currently waiting"  color="#f59e0b"/>
          <StatCard value={data.discharged}       label="Discharged today"   color="#4ade80"/>
          <StatCard value={data.languages?.length || 0} label="Languages spoken" color="#a78bfa"/>
        </div>

        {/* Patient volume by hour */}
        <div style={S.card}>
          <p style={S.sectionLabel}>Patient volume by hour</p>
          <BarChart data={data.byHour} color="#3B8BD4"/>
        </div>

        {/* Wait times + urgency side by side */}
        <div style={S.grid2}>
          <div style={S.card}>
            <p style={S.sectionLabel}>Avg wait time by department</p>
            {data.avgWaitByDept?.length === 0 ? (
              <div style={S.empty}>No discharged patients yet</div>
            ) : (
              data.avgWaitByDept?.map(d => (
                <HorizontalBar
                  key={d.department}
                  label={DEPT_NAMES[d.department] || d.department}
                  value={d.avg_wait_minutes || 0}
                  max={maxWait}
                  color={DEPT_COLORS[d.department]?.border || "#3B8BD4"}
                />
              ))
            )}
          </div>

          <div style={S.card}>
            <p style={S.sectionLabel}>Urgency breakdown</p>
            {data.urgencyBreakdown?.length === 0 ? (
              <div style={S.empty}>No patients yet</div>
            ) : (
              ["high", "medium", "low"].map(u => {
                const found = data.urgencyBreakdown?.find(d => d.urgency === u);
                const count = found?.count || 0;
                const pct = totalUrgency > 0 ? Math.round((count / totalUrgency) * 100) : 0;
                return (
                  <div key={u} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: "#334155" }}>{URGENCY[u].label}</span>
                      <span style={{ color: "#64748b" }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: URGENCY[u].color, borderRadius: 99, transition: "width 0.5s ease" }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Languages */}
        {data.languages?.length > 0 && (
          <div style={S.card}>
            <p style={S.sectionLabel}>Languages spoken today</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.languages.map(l => (
                <div key={l.language} style={S.langBadge}>
                  <span style={{ fontWeight: 600 }}>{l.language}</span>
                  <span style={{ color: "#94a3b8", marginLeft: 6 }}>{l.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const S = {
  root:         { fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" },
  header:       { display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#fff" },
  logo:         { fontSize: 22, color: "#3B8BD4", fontWeight: 700 },
  title:        { flex: 1, fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" },
  body:         { padding: 24, display: "flex", flexDirection: "column", gap: 20 },
  grid4:        { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  grid2:        { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  card:         { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  statCard:     { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" },
  empty:        { fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "20px 0" },
  loading:      { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#94a3b8", fontSize: 15 },
  langBadge:    { background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#334155" },
};