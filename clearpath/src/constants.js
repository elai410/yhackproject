export const DEPARTMENTS = {
  rabies:    { id: "rabies",    name: "Rabies Vaccine Clinic",  floor: "1", room: "A3",           wait: 12 },
  emergency: { id: "emergency", name: "Adult Emergency",        floor: "1", room: "South Pavilion",wait: 38 },
  pediatric: { id: "pediatric", name: "Pediatric Emergency",    floor: "1", room: "Children's Hospital", wait: 22 },
  triage:    { id: "triage",    name: "Admitting & Triage",     floor: "1", room: "East Pavilion", wait: 8  },
  atrium:    { id: "atrium",    name: "Atrium / Cafeteria",     floor: "1", room: "Atrium",        wait: 5  },
  clinicbldg:{ id: "clinicbldg",name: "Clinic Building",        floor: "1", room: "Clinic Bldg",  wait: 15 },
  dana:      { id: "dana",      name: "Dana Building",          floor: "1", room: "Dana Bldg",     wait: 10 },
  ypb:       { id: "ypb",       name: "Yale Physicians Building",floor: "1", room: "YPB",          wait: 20 },
  north:     { id: "north",     name: "North Pavilion",         floor: "1", room: "North Pavilion",wait: 18 },
  fitkin:    { id: "fitkin",    name: "Fitkin Building",        floor: "2", room: "Fitkin Bldg",   wait: 12 },
  winchester:{ id: "winchester",name: "Winchester Building",    floor: "1", room: "Winchester Bldg",wait: 10 },
};

export const DEPT_NAMES = {
  rabies:     "Rabies Vaccine Clinic",
  emergency:  "Adult Emergency",
  pediatric:  "Pediatric Emergency",
  triage:     "Admitting & Triage",
  atrium:     "Atrium / Cafeteria",
  clinicbldg: "Clinic Building",
  dana:       "Dana Building",
  ypb:        "Yale Physicians Building",
  north:      "North Pavilion",
  fitkin:     "Fitkin Building",
  winchester: "Winchester Building",
};

export const DEPT_LIST = [
  "rabies", "emergency", "pediatric", "triage",
  "atrium", "clinicbldg", "dana", "ypb", "north", "fitkin", "winchester",
];

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
  alert_room:          "Please head to",
  alert_wait_msg:      "We'll alert you when it's almost your turn. You don't need to stay glued to this screen.",
  allset:              "You're all set! 🎉",
  thank_you:           "Thank you for visiting ClearPath",
  directions:          ["Enter through the main entrance", "Follow the blue line on the floor", "Take the corridor indicated", "Look for your destination building"],
  expect:              ["Show your QR code or give your name at the desk", "A nurse will take your vitals", "A doctor will see you shortly after"],
  back:                "← Back",
  min:                 "min",
  urgency_label:       "urgency",
};

export const urgencyColor = (u) =>
  u === "high" ? "#fee2e2" : u === "medium" ? "#fef9c3" : "#dcfce7";

export const DEPT_COLORS = {
  rabies:     { bg: "#e0f2fe", border: "#38bdf8", text: "#0369a1" },
  emergency:  { bg: "#FAEEDA", border: "#854F0B", text: "#633806" },
  pediatric:  { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489" },
  triage:     { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
  atrium:     { bg: "#EAF3DE", border: "#3B6D11", text: "#27500A" },
  clinicbldg: { bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
  dana:       { bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
  ypb:        { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
  north:      { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
  fitkin:     { bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
  winchester: { bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
};