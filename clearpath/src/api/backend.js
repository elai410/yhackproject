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

export async function updateStatus(id, status) {
  const res = await fetch(`${API}/api/update-status/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Status update failed");
  return res.json();
}

export const DEPT_ROOM = {
  rabies:     { room: "Room A3",             floor: "1" },
  emergency:  { room: "South Pavilion",      floor: "1" },
  pediatric:  { room: "Children's Hospital", floor: "1" },
  triage:     { room: "East Pavilion",       floor: "1" },
  atrium:     { room: "Atrium",              floor: "1" },
  clinicbldg: { room: "Clinic Building",     floor: "1" },
  dana:       { room: "Dana Building",       floor: "1" },
  ypb:        { room: "Yale Physicians",     floor: "1" },
  north:      { room: "North Pavilion",      floor: "1" },
  fitkin:     { room: "Fitkin Building",     floor: "2" },
  winchester: { room: "Winchester Building", floor: "1" },
};

export const STATUS_LABELS = {
  waiting:           "Waiting",
  in_progress:       "In progress",
  pending_test:      "Pending test",
  pending_signature: "Pending signature",
  pending_transport: "Pending transport",
  pending_bed:       "Pending bed",
  called:            "Called",
};

export const STATUS_COLORS = {
  waiting:           { bg: "#f1f5f9", color: "#64748b" },
  in_progress:       { bg: "#dcfce7", color: "#15803d" },
  pending_test:      { bg: "#e0f2fe", color: "#0369a1" },
  pending_signature: { bg: "#fef9c3", color: "#a16207" },
  pending_transport: { bg: "#f3e8ff", color: "#7e22ce" },
  pending_bed:       { bg: "#ffedd5", color: "#c2410c" },
  called:            { bg: "#ede9fe", color: "#6d28d9" },
};

export const WS_URL  = "ws://localhost:3001";
export const API_URL = API;