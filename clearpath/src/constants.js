export const DEPARTMENTS = {
  rabies:    { id: "rabies",    name: "Rabies Vaccine Clinic", floor: "1", room: "A3", wait: 12 },
  emergency: { id: "emergency", name: "Emergency Room",        floor: "2", room: "B1", wait: 38 },
  pediatric: { id: "pediatric", name: "Pediatric ER",          floor: "2", room: "B4", wait: 22 },
  triage:    { id: "triage",    name: "General Triage",        floor: "1", room: "A1", wait: 8  },
};

export const DEPT_NAMES = {
  rabies:    "Rabies Clinic",
  emergency: "Emergency Room",
  pediatric: "Pediatric ER",
  triage:    "General Triage",
};

export const DEPT_LIST = ["rabies", "emergency", "pediatric", "triage"];

export const DEFAULT_UI = {
  heading:             "What brings you in today?",
  sub:                 "Describe your situation in your own words. We'll guide you to the right place.",
  btn_route:           "Find my care →",
  btn_checkin:         "Confirm check-in →",
  btn_arrived:         "I've arrived — show my queue position",
  btn_followup:        "Get follow-up reminder →",
  label_routed:        "You've been routed to",
  label_position:      "Your position",
  label_queue:         "in line at",
  label_wait:          "Estimated wait",
  label_directions:    "Walking directions",
  label_qr:            "Your check-in QR",
  label_discharge:     "Discharge instructions",
  label_followup_card: "Your 3-day follow-up reminder",
  label_name:          "Your name (optional)",
  label_phone:         "Phone for SMS alerts (optional)",
  alert_turn:          "It's your turn!",
  alert_room:          "Please head to Room",
  alert_wait_msg:      "We'll alert you when it's almost your turn. You don't need to stay glued to this screen.",
  allset:              "You're all set! 🎉",
  thank_you:           "Thank you for visiting ClearPath",
  directions:          ["Enter through the main entrance", "Follow the blue line on the floor", "Take the corridor on the left", "Look for your room"],
  expect:              ["Show your QR code or give your name at the desk", "A nurse will take your vitals", "A doctor will see you shortly after"],
  back:                "← Back",
  min:                 "min",
  urgency_label:       "urgency",
};

export const urgencyColor = (u) =>
  u === "high" ? "#fee2e2" : u === "medium" ? "#fef9c3" : "#dcfce7";

export const DEPT_COLORS = {
  rabies:    { bg: "#e0f2fe", border: "#38bdf8", text: "#0369a1" },
  emergency: { bg: "#fee2e2", border: "#f87171", text: "#b91c1c" },
  pediatric: { bg: "#fef9c3", border: "#facc15", text: "#a16207" },
  triage:    { bg: "#dcfce7", border: "#4ade80", text: "#15803d" },
};