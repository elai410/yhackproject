const API = "http://localhost:3001";

export async function routePatient(situation) {
  const res = await fetch(`${API}/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ situation }),
  });
  if (!res.ok) throw new Error("Routing failed");
  return res.json();
}

export async function checkinPatient(payload) {
  const res = await fetch(`${API}/api/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Check-in failed");
  return res.json();
}

export async function fetchPatient(id) {
  const res = await fetch(`${API}/api/patient/${id}`);
  if (!res.ok) throw new Error("Patient not found");
  return res.json();
}

export async function fetchAllPatients() {
  const res = await fetch(`${API}/api/patients`);
  if (!res.ok) throw new Error("Could not fetch patients");
  return res.json();
}

export async function callNext(department) {
  const res = await fetch(`${API}/api/call-next/${department}`, { method: "POST" });
  if (!res.ok) throw new Error("Call next failed");
  return res.json();
}

export async function dischargePatient(id, instructions) {
  const res = await fetch(`${API}/api/discharge/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions }),
  });
  if (!res.ok) throw new Error("Discharge failed");
  return res.json();
}

export async function movePatient(id, department, room, floor) {
  const res = await fetch(`${API}/api/move/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ department, room, floor, reason: `Transferred to ${department}` }),
  });
  if (!res.ok) throw new Error("Move failed");
  return res.json();
}

export const WS_URL = "ws://localhost:3001";
export const API_URL = API;