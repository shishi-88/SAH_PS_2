import { describe, expect, it } from "vitest";
import { buildGapGroups, suggestSmallGroups, toAggregatedReport } from "./class-overview";
import { daysAgoIso } from "./ids";
import type { SkillGapRecord, Student } from "./types";

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
    const report = toAggregatedReport(students, [gap()]);
    const blob = JSON.stringify(report);
    expect(blob).not.toContain("Secret Name");
    expect(blob).not.toContain("s1");
    expect(report.gapTypes[0].studentCount).toBe(1);
  });
});
