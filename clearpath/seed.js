import Database from "better-sqlite3";
import { v4 as uuid } from "uuid";

const db = new Database("clearpath.db");

const patients = [
  // Emergency - high urgency
  {
    name: "James Carter",
    situation: "Severe chest pain radiating to my left arm, started 20 minutes ago",
    summary: "Patient reporting acute chest pain with left arm radiation for 20 minutes. Possible cardiac event.",
    department: "emergency",
    room: "South Pavilion",
    floor: "1",
    urgency: "high",
    reason: "Chest pain with arm radiation — possible cardiac emergency",
    language: "English",
    sentiment: "scared",
    sentimentNote: "Patient is visibly frightened, came in alone",
    status: "in_progress",
    minutesAgo: 45,
  },
  {
    name: "Rosa Delgado",
    situation: "Mi hija tiene fiebre muy alta y convulsiones",
    summary: "Patient's daughter has high fever with seizures. Pediatric emergency.",
    department: "pediatric",
    room: "Children's Hospital",
    floor: "1",
    urgency: "high",
    reason: "Child with high fever and seizures — pediatric emergency",
    language: "Spanish",
    sentiment: "distressed",
    sentimentNote: "Mother is extremely distressed, speaking only Spanish",
    status: "waiting",
    minutesAgo: 8,
  },
  {
    name: "David Kim",
    situation: "I was in a car accident, my head hurts and I'm dizzy",
    summary: "Post-accident head trauma with dizziness. Possible concussion.",
    department: "emergency",
    room: "South Pavilion",
    floor: "1",
    urgency: "high",
    reason: "Head trauma from car accident — concussion evaluation needed",
    language: "English",
    sentiment: "confused",
    sentimentNote: "Patient appears disoriented, may have concussion",
    status: "pending_test",
    minutesAgo: 52,
  },

  // Medium urgency
  {
    name: "Maria Santos",
    situation: "Dog bite on my hand, the dog was a stray and I don't know if it was vaccinated",
    summary: "Stray dog bite to hand. Rabies vaccine evaluation needed urgently.",
    department: "rabies",
    room: "Room A3",
    floor: "1",
    urgency: "medium",
    reason: "Stray dog bite — rabies vaccine assessment required",
    language: "English",
    sentiment: "anxious",
    sentimentNote: "Patient is worried about rabies exposure",
    status: "waiting",
    minutesAgo: 15,
  },
  {
    name: "Amara Okafor",
    situation: "I have been having severe abdominal pain for two days, no appetite",
    summary: "Two days of severe abdominal pain with loss of appetite. Digestive evaluation needed.",
    department: "dana",
    room: "Dana Building",
    floor: "1",
    urgency: "medium",
    reason: "Severe abdominal pain for 2 days — digestive health evaluation",
    language: "English",
    sentiment: "in-pain",
    sentimentNote: "Patient appears to be in significant pain, holding stomach",
    status: "pending_signature",
    minutesAgo: 38,
  },
  {
    name: "Wei Zhang",
    situation: "我需要做MRI检查，医生已经开了单子",
    summary: "Patient has a doctor's referral for an MRI scan.",
    department: "clinicbldg",
    room: "Clinic Building",
    floor: "1",
    urgency: "low",
    reason: "MRI referral from primary care physician",
    language: "Chinese",
    sentiment: "calm",
    sentimentNote: "Patient is calm, has paperwork ready",
    status: "waiting",
    minutesAgo: 5,
  },
  {
    name: "Fatima Al-Hassan",
    situation: "أنا حامل في الشهر الثامن وأشعر بآلام في البطن",
    summary: "8-month pregnant patient experiencing abdominal pain. Obstetric evaluation needed.",
    department: "pediatric",
    room: "Children's Hospital",
    floor: "4",
    urgency: "medium",
    reason: "Third trimester abdominal pain — obstetric emergency evaluation",
    language: "Arabic",
    sentiment: "scared",
    sentimentNote: "Patient is scared, traveling without partner, Arabic-speaking only",
    status: "in_progress",
    minutesAgo: 22,
  },
  {
    name: "Thomas Greene",
    situation: "I fell off a ladder and my wrist is swollen and painful, can't move it",
    summary: "Fall from ladder with swollen wrist, possible fracture.",
    department: "ypb",
    room: "Yale Physicians",
    floor: "1",
    urgency: "medium",
    reason: "Wrist injury from fall — possible fracture",
    language: "English",
    sentiment: "calm",
    sentimentNote: "Patient is calm but in pain, came with family",
    status: "pending_test",
    minutesAgo: 30,
  },

  // Low urgency
  {
    name: "Linda Hoffman",
    situation: "I need a pulmonary function test, my doctor referred me",
    summary: "Routine pulmonary function test referral from primary care.",
    department: "fitkin",
    room: "Fitkin Building",
    floor: "2",
    urgency: "low",
    reason: "Routine pulmonary function test — scheduled referral",
    language: "English",
    sentiment: "calm",
    sentimentNote: "Patient is relaxed, routine appointment",
    status: "waiting",
    minutesAgo: 3,
  },
  {
    name: "Carlos Mendez",
    situation: "Necesito ver a un psiquiatra, he tenido pensamientos muy difíciles",
    summary: "Patient seeking psychiatric evaluation, reporting difficult thoughts.",
    department: "winchester",
    room: "Winchester Building",
    floor: "1",
    urgency: "medium",
    reason: "Psychiatric evaluation needed — patient reporting difficult thoughts",
    language: "Spanish",
    sentiment: "anxious",
    sentimentNote: "Patient appears withdrawn and anxious, needs compassionate care",
    status: "waiting",
    minutesAgo: 11,
  },
  {
    name: "Helen Park",
    situation: "I've had blurry vision for a week and my optometrist said to come here",
    summary: "Week-long blurry vision with optometrist referral to ophthalmology.",
    department: "dana",
    room: "Dana Building",
    floor: "2",
    urgency: "low",
    reason: "Vision changes — ophthalmology referral from optometrist",
    language: "English",
    sentiment: "calm",
    sentimentNote: "Patient is calm, brought referral letter",
    status: "called",
    minutesAgo: 40,
  },
  {
    name: "Samuel Osei",
    situation: "Je dois faire une mammographie de routine",
    summary: "Routine mammography screening appointment.",
    department: "north",
    room: "North Pavilion",
    floor: "1",
    urgency: "low",
    reason: "Routine mammography screening",
    language: "French",
    sentiment: "calm",
    sentimentNote: "Patient is calm, routine screening",
    status: "pending_transport",
    minutesAgo: 25,
  },
  {
    name: "Michael Torres",
    situation: "bat flew into my house last night and scratched my arm while I was trying to get it out",
    summary: "Bat scratch exposure at home last night. Rabies post-exposure evaluation needed.",
    department: "rabies",
    room: "Room A3",
    floor: "1",
    urgency: "medium",
    reason: "Bat scratch — rabies post-exposure prophylaxis evaluation",
    language: "English",
    sentiment: "anxious",
    sentimentNote: "Patient is anxious about rabies risk, researched online before coming",
    status: "waiting",
    minutesAgo: 6,
  },
  {
    name: "Anna Kowalski",
    situation: "I have been feeling very sad and isolated for months, my family made me come",
    summary: "Patient reporting prolonged depression and social isolation, brought in by family.",
    department: "winchester",
    room: "Winchester Building",
    floor: "1",
    urgency: "medium",
    reason: "Depression evaluation — months of persistent low mood and isolation",
    language: "English",
    sentiment: "distressed",
    sentimentNote: "Patient seems reluctant to be here, family is supportive",
    status: "in_progress",
    minutesAgo: 18,
  },
  {
    name: "Ibrahim Hassan",
    situation: "I need to get my pre-admission testing done before my surgery next week",
    summary: "Pre-surgical testing appointment ahead of scheduled procedure next week.",
    department: "triage",
    room: "East Pavilion",
    floor: "1",
    urgency: "low",
    reason: "Pre-admission testing for scheduled surgery",
    language: "English",
    sentiment: "calm",
    sentimentNote: "Patient is calm and prepared, has all paperwork",
    status: "pending_bed",
    minutesAgo: 35,
  },
];

// Clear existing patients for clean demo
db.prepare(`DELETE FROM patients`).run();

const insert = db.prepare(`
  INSERT INTO patients (
    id, name, situation, summary, department, room, floor,
    urgency, reason, phone, language, sentiment, sentimentNote,
    queue_position, status, checked_in_at, last_updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, datetime('now', ? || ' minutes'), datetime('now', ? || ' minutes')
  )
`);

// Group by department to assign queue positions
const deptCounters = {};

patients.forEach((p) => {
  const id = uuid();
  deptCounters[p.department] = (deptCounters[p.department] || 0) + 1;
  const queuePos = deptCounters[p.department];
  const offset = `-${p.minutesAgo}`;

  insert.run(
    id, p.name, p.situation, p.summary,
    p.department, p.room, p.floor,
    p.urgency, p.reason,
    "", p.language, p.sentiment, p.sentimentNote,
    queuePos, p.status,
    offset, offset
  );
});

console.log(`✅ Seeded ${patients.length} demo patients successfully`);
console.log("\nPatients by department:");
Object.entries(deptCounters).forEach(([dept, count]) => {
  console.log(`  ${dept}: ${count} patient${count > 1 ? "s" : ""}`);
});
console.log("\nLanguages represented: English, Spanish, Arabic, Chinese, French");
console.log("Sentiments: calm, anxious, scared, confused, distressed, in-pain");
console.log("Statuses: waiting, in_progress, pending_test, pending_signature, pending_transport, pending_bed, called");