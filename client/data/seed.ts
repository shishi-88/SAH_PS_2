import { createId, daysAgoIso, daysFrom } from "@/domain/ids";
import type {
  AppSnapshot,
  Assessment,
  AvatarTint,
  Classroom,
  SkillGapRecord,
  Student,
  WorksheetInstance,
} from "@/domain/types";

const TINTS: AvatarTint[] = ["teal", "coral", "sand", "sage"];

export function emptyClassroom(): Classroom {
  return {
    id: createId("class"),
    name: "Morning section · Class 1–3",
    teacherLabel: "Class teacher",
    reassessmentDays: 14,
    studentsPerDay: 5,
    rotationStartedAt: new Date().toISOString(),
    assessedInRotationIds: [],
    createdAt: new Date().toISOString(),
  };
}

function student(
  classId: string,
  name: string,
  grade: 1 | 2 | 3,
  roll: string,
  i: number,
  lastDays: number | null,
): Student {
  return {
    id: createId("stu"),
    classId,
    name,
    grade,
    rollNo: roll,
    avatarTint: TINTS[i % TINTS.length],
    createdAt: daysAgoIso(40),
    lastAssessedAt: lastDays === null ? null : daysAgoIso(lastDays),
  };
}

export function createDemoSnapshot(): AppSnapshot {
  const classroom = emptyClassroom();
  const names: Array<[string, 1 | 2 | 3, string, number | null]> = [
    ["Ananya Verma", 1, "01", 2],
    ["Rahul Kumar", 1, "02", 9],
    ["Fatima Sheikh", 2, "03", 1],
    ["Vivaan Singh", 2, "04", 15],
    ["Meera Joshi", 3, "05", 3],
    ["Aarav Patil", 3, "06", 30],
    ["Sara Khan", 1, "07", null],
    ["Kabir Reddy", 2, "08", 4],
    ["Diya Nair", 1, "09", 1],
    ["Ishaan Mehta", 3, "10", null],
  ];
  const students = names.map((n, i) => student(classroom.id, n[0], n[1], n[2], i, n[3]));

  const assessed = students
    .filter((s) => s.lastAssessedAt && new Date(s.lastAssessedAt).getTime() > Date.now() - 8 * 86400000)
    .map((s) => s.id);
  classroom.assessedInRotationIds = assessed;

  const byRoll = (roll: string) => students.find((s) => s.rollNo === roll)!;

  const gaps: SkillGapRecord[] = [
    gap(byRoll("01").id, "letter-sound-bd", "reading", 20, 14, ["ws_demo_1"], 1),
    gap(byRoll("02").id, "decade-9-10", "numeracy", 9, 14, ["ws_demo_2"], 1),
    gap(byRoll("03").id, "consonant-blend-bl-cl-st", "reading", 25, 14, ["ws_demo_3"], 2),
    gap(byRoll("03").id, "decade-29-30", "numeracy", 6, 14, ["ws_demo_4"], 1),
    gap(byRoll("04").id, "decade-29-30", "numeracy", 15, 14, ["ws_demo_5"], 1),
    gap(byRoll("05").id, "multisyllable-decoding", "reading", 3, 14, ["ws_demo_6"], 1),
    gap(byRoll("06").id, "place-value-tens-hundreds", "numeracy", 30, 14, ["ws_demo_7"], 1),
    gap(byRoll("08").id, "backward-counting", "numeracy", 4, 14, ["ws_demo_8"], 1),
    gap(byRoll("09").id, "sight-word-recall", "reading", 35, 14, ["ws_demo_9"], 2),
  ];

  const assessments: Assessment[] = gaps.map((g) => ({
    id: createId("asm"),
    studentId: g.studentId,
    subject: g.subject,
    grade: students.find((s) => s.id === g.studentId)!.grade,
    promptId: g.subject === "reading" ? "read-g1-boat" : "num-g2-decades",
    timestamp: g.lastDetectedAt,
    kind: "initial",
    relatedGapId: g.id,
    evidence: { observations: [] },
    detectedGapTypeIds: [g.gapTypeId],
    analysisSource: "teacher-assisted",
    summary: "Demo history seeded on this phone.",
  }));

  gaps.forEach((g, i) => {
    g.assessmentIds = [assessments[i].id];
  });

  const worksheets: WorksheetInstance[] = gaps.map((g, i) => ({
    id: g.worksheetIds[0],
    studentId: g.studentId,
    gapRecordId: g.id,
    templateId: "seed",
    assignedAt: g.firstDetectedAt,
    tier: g.currentTier,
    title: "Practice sheet (from earlier assessment)",
    focus: "Linked to the diagnosed gap on this student's record.",
    items: [{ prompt: "Continue the last drill assigned in class." }],
  }));

  return {
    classroom,
    students,
    assessments,
    gaps,
    worksheets,
    syncQueue: [],
    storageNote: "",
  };
}

function gap(
  studentId: string,
  gapTypeId: string,
  subject: SkillGapRecord["subject"],
  firstDaysAgo: number,
  reassessDays: number,
  worksheetIds: string[],
  tier: 1 | 2 | 3,
): SkillGapRecord {
  const first = daysAgoIso(firstDaysAgo);
  return {
    id: createId("gap"),
    studentId,
    gapTypeId,
    subject,
    status: "active",
    firstDetectedAt: first,
    lastDetectedAt: first,
    resolvedAt: null,
    currentTier: tier,
    reassessmentDueAt: daysFrom(first, reassessDays),
    worksheetIds,
    assessmentIds: [],
  };
}
