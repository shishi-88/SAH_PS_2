import { describe, expect, it } from "vitest";
import {
  buildGapGroups,
  buildTodayActions,
  gapStage,
  gradeStats,
  suggestSmallGroups,
  toAggregatedReport,
} from "./class-overview";
import { daysAgoIso } from "./ids";
import type {
  Classroom,
  SkillGapRecord,
  Student,
  WorksheetInstance,
} from "./types";

const gap = (over: Partial<SkillGapRecord>): SkillGapRecord => ({
  id: "g1",
  studentId: "s1",
  gapTypeId: "decade-29-30",
  subject: "numeracy",
  status: "active",
  firstDetectedAt: daysAgoIso(25),
  lastDetectedAt: daysAgoIso(1),
  resolvedAt: null,
  currentTier: 1,
  reassessmentDueAt: daysAgoIso(-1),
  worksheetIds: [],
  assessmentIds: [],
  ...over,
});

describe("class overview", () => {
  it("aggregates shared gap types without scores", () => {
    const groups = buildGapGroups([
      gap({ id: "a", studentId: "s1" }),
      gap({ id: "b", studentId: "s2" }),
      gap({
        id: "c",
        studentId: "s3",
        gapTypeId: "consonant-blend-bl-cl-st",
        subject: "reading",
        firstDetectedAt: daysAgoIso(2),
      }),
    ]);
    const decade = groups.find((g) => g.gapTypeId === "decade-29-30");
    expect(decade?.studentCount).toBe(2);
    expect(decade?.urgency).toBe("persistent");
    expect(suggestSmallGroups(groups).length).toBeGreaterThan(0);
  });

  it("summarises each grade without mixing students", () => {
    const students: Student[] = [
      {
        id: "s1",
        classId: "c",
        name: "A",
        grade: 1,
        rollNo: "01",
        avatarTint: "teal",
        createdAt: daysAgoIso(1),
        lastAssessedAt: daysAgoIso(1),
      },
      {
        id: "s2",
        classId: "c",
        name: "B",
        grade: 1,
        rollNo: "02",
        avatarTint: "coral",
        createdAt: daysAgoIso(1),
        lastAssessedAt: null,
      },
      {
        id: "s3",
        classId: "c",
        name: "C",
        grade: 2,
        rollNo: "03",
        avatarTint: "yellow",
        createdAt: daysAgoIso(1),
        lastAssessedAt: null,
      },
    ];
    const gaps: SkillGapRecord[] = [
      gap({ id: "g1", studentId: "s1", gapTypeId: "letter-recognition-general", subject: "reading" }),
      gap({ id: "g2", studentId: "s2", gapTypeId: "letter-recognition-general", subject: "reading" }),
      gap({ id: "g3", studentId: "s3", gapTypeId: "addition-facts", subject: "numeracy" }),
    ];
    const g1 = gradeStats(students, gaps, 1);
    const g2 = gradeStats(students, gaps, 2);
    expect(g1.total).toBe(2);
    expect(g1.assessedCount).toBe(1);
    expect(g1.topGapTypeIds[0]).toEqual({
      gapTypeId: "letter-recognition-general",
      count: 2,
    });
    expect(g1.topGapTypeIds.some((t) => t.gapTypeId === "addition-facts")).toBe(false);
    expect(g2.total).toBe(1);
    expect(g2.topGapTypeIds[0].gapTypeId).toBe("addition-facts");
  });

  it("omits student names from aggregated reports", () => {
    const students: Student[] = [
      {
        id: "s1",
        classId: "c",
        name: "Secret Name",
        grade: 2,
        rollNo: "01",
        avatarTint: "teal",
        createdAt: daysAgoIso(1),
        lastAssessedAt: null,
      },
    ];
    const report = toAggregatedReport(students, [gap({})]);
    const blob = JSON.stringify(report);
    expect(blob).not.toContain("Secret Name");
    expect(blob).not.toContain("s1");
    expect(report.gapTypes[0].studentCount).toBe(1);
  });

  it("derives the practice stage of a gap", () => {
    const ws = (status?: WorksheetInstance["status"]): WorksheetInstance => ({
      id: "w1",
      studentId: "s1",
      gapRecordId: "g1",
      templateId: "t1",
      assignedAt: daysAgoIso(3),
      tier: 1,
      status,
      title: "T",
      focus: "F",
      items: [],
    });
    expect(gapStage(gap({ id: "g1", status: "resolved" }), [ws("practiced")])).toBe(
      "resolved",
    );
    expect(gapStage(gap({ id: "g1", reassessmentDueAt: daysAgoIso(1) }), [ws("practiced")])).toBe(
      "ready",
    );
    expect(gapStage(gap({ id: "g1", reassessmentDueAt: daysAgoIso(-1) }), [ws("practiced")])).toBe(
      "practicing",
    );
    expect(gapStage(gap({ id: "g1" }), [ws("assigned")])).toBe("needs-practice");
    expect(gapStage(gap({ id: "g1" }), [])).toBe("needs-practice");
  });

  it("builds today's actions from existing records", () => {
    const classroom: Classroom = {
      id: "c",
      name: "C",
      teacherLabel: "t",
      reassessmentDays: 14,
      studentsPerDay: 3,
      rotationStartedAt: daysAgoIso(1),
      assessedInRotationIds: [],
      createdAt: daysAgoIso(1),
    };
    const student = (id: string, roll: string): Student => ({
      id,
      classId: "c",
      name: id.toUpperCase(),
      grade: 1,
      rollNo: roll,
      avatarTint: "teal",
      createdAt: daysAgoIso(1),
      lastAssessedAt: null,
    });
    const students = [student("s1", "01"), student("s2", "02"), student("s3", "03"), student("s4", "04")];
    const ws = (gapRecordId: string, status: WorksheetInstance["status"]): WorksheetInstance => ({
      id: `w-${gapRecordId}`,
      studentId: gapRecordId,
      gapRecordId,
      templateId: "t1",
      assignedAt: daysAgoIso(3),
      tier: 1,
      status,
      title: "T",
      focus: "F",
      items: [],
    });
    const gaps: SkillGapRecord[] = [
      /* s1: practiced + due → reassess */
      gap({ id: "ga", studentId: "s1", reassessmentDueAt: daysAgoIso(1) }),
      /* s2, s3, s4 share a blend gap without practice → practice + small group */
      gap({
        id: "gb",
        studentId: "s2",
        gapTypeId: "consonant-blend-bl-cl-st",
        subject: "reading",
        reassessmentDueAt: daysAgoIso(1),
      }),
      gap({
        id: "gc",
        studentId: "s3",
        gapTypeId: "consonant-blend-bl-cl-st",
        subject: "reading",
        reassessmentDueAt: daysAgoIso(1),
      }),
      gap({
        id: "gd",
        studentId: "s4",
        gapTypeId: "consonant-blend-bl-cl-st",
        subject: "reading",
        reassessmentDueAt: daysAgoIso(1),
      }),
    ];
    const worksheets = [ws("ga", "practiced")];

    const today = buildTodayActions(classroom, students, gaps, worksheets);
    expect(today.reassessGaps.map((g) => g.studentId)).toEqual(["s1"]);
    expect(today.practiceStudents.map((s) => s.id).sort()).toEqual(["s2", "s3", "s4"]);
    /* s1 is busy with reassessment, so it drops out of the assess list */
    expect(today.assessStudents.map((s) => s.id)).toEqual([]);
    expect(today.group?.gapTypeId).toBe("consonant-blend-bl-cl-st");
    expect(today.group?.studentCount).toBe(3);
    expect(today.allClear).toBe(false);

    const empty = buildTodayActions(
      classroom,
      students,
      [],
      [],
    );
    expect(empty.assessStudents.length).toBe(3);
    expect(empty.allClear).toBe(false);
  });
});
