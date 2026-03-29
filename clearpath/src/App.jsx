import { useState, useRef } from "react";
import Steps from "./components/Steps.jsx";
import Intake from "./pages/Intake.jsx";
import Checkin from "./pages/Checkin.jsx";
import Navigate from "./pages/Navigate.jsx";
import Queue from "./pages/Queue.jsx";
import Care from "./pages/Care.jsx";
import Discharge from "./pages/Discharge.jsx";
import { routePatient, checkinPatient, fetchPatient, WS_URL } from "./api/backend.js";
import { generateFollowUp } from "./api/claude.js";
import { DEPARTMENTS, DEFAULT_UI } from "./constants.js";

export default function App() {
  const [step, setStep]           = useState(0);
  const [situation, setSituation] = useState("");
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [patient, setPatient]     = useState(null);
  const [dept, setDept]           = useState(null);
  const [queuePos, setQueuePos]   = useState(null);
  const [discharge, setDischarge] = useState(null);
  const [followUp, setFollowUp]   = useState("");
  const [ui, setUi]               = useState(DEFAULT_UI);
  const [detectedLang, setDetectedLang] = useState(null);
  const wsRef = useRef(null);

  function connectWS(patientId) {
    const ws = new WebSocket(`${WS_URL}?id=${patientId}`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "YOU_ARE_CALLED") setStep(4);
      if (msg.type === "QUEUE_UPDATED") {
        fetchPatient(patientId).then(p => setQueuePos(p.queue_position));
      }
      if (msg.type === "DISCHARGED") { setDischarge(msg.instructions); setStep(5); }
      if (msg.type === "DEPARTMENT_CHANGED") {
        setPatient(msg.patient);
        setDept(DEPARTMENTS[msg.patient.department] || dept);
        setStep(2);
      }
    };
    wsRef.current = ws;
  }

  async function handleRoute() {
    if (!situation.trim()) return;
    setLoading(true);
    try {
      const data = await routePatient(situation);
      if (data.ui) setUi({ ...DEFAULT_UI, ...data.ui });
      if (data.detectedLanguage) setDetectedLang(data.detectedLanguage);
      setDept(DEPARTMENTS[data.department] || DEPARTMENTS.triage);
      setPatient({ ...data, situation });
      setStep(1);
    } catch {
      alert("Could not connect to server. Is it running?");
    }
    setLoading(false);
  }

  async function handleCheckin() {
    setLoading(true);
    try {
      const data = await checkinPatient({
        name: name || "Patient",
        situation,
        department: dept.id,
        room: dept.room,
        floor: dept.floor,
        urgency: patient.urgency,
        reason: patient.reason,
        phone,
        language: detectedLang || "English",
      });
      setPatient(data.patient);
      setQueuePos(data.patient.queue_position);
      connectWS(data.patient.id);
      setStep(2);
    } catch {
      alert("Check-in failed. Is the server running?");
    }
    setLoading(false);
  }

  async function handleFollowUp() {
    setLoading(true);
    try {
      const text = await generateFollowUp(situation, discharge, detectedLang);
      setFollowUp(text);
    } catch {
      alert("Could not generate follow-up.");
    }
    setLoading(false);
  }

  return (
    <div style={S.root}>
      <header style={S.header}>
        <span style={S.logo}>＋</span>
        <h1 style={S.title}>ClearPath</h1>
        {detectedLang && (
          <span style={S.langBadge}>{detectedLang}</span>
        )}
      </header>

      <div style={S.body}>
        <Steps current={step} />

        {step === 0 && <Intake situation={situation} setSituation={setSituation} ui={ui} loading={loading} onSubmit={handleRoute}/>}
        {step === 1 && dept && patient && <Checkin dept={dept} patient={patient} name={name} setName={setName} phone={phone} setPhone={setPhone} ui={ui} loading={loading} onCheckin={handleCheckin} onBack={() => setStep(0)}/>}
        {step === 2 && dept && <Navigate dept={dept} patient={patient} ui={ui} onArrived={() => setStep(3)}/>}
        {step === 3 && <Queue queuePos={queuePos} dept={dept} ui={ui}/>}
        {step === 4 && <Care dept={dept} ui={ui}/>}
        {step === 5 && <Discharge discharge={discharge} followUp={followUp} ui={ui} loading={loading} onFollowUp={handleFollowUp}/>}
      </div>
    </div>
  );
}

const S = {
  root:      { fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" },
  header:    { display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 12px", borderBottom: "1px solid #e2e8f0", background: "#fff" },
  logo:      { fontSize: 22, color: "#3B8BD4", fontWeight: 700 },
  title:     { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" },
  langBadge: { fontSize: 12, color: "#3B8BD4", fontWeight: 600, background: "#e0f2fe", padding: "3px 10px", borderRadius: 99 },
  body:      { padding: 20, display: "flex", flexDirection: "column", gap: 16 },
};