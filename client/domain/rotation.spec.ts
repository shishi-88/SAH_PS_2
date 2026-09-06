import { describe, expect, it } from "vitest";
import { markAssessedInRotation, rotationView } from "./rotation";
import type { Classroom, Student } from "./types";

const classroom: Classroom = {
  id: "c",
  name: "Demo",
  teacherLabel: "Teacher",
  reassessmentDays: 14,
  studentsPerDay: 5,
  rotationStartedAt: new Date().toISOString(),
  assessedInRotationIds: ["a"],
  createdAt: new Date().toISOString(),
};

const students = ["a", "b", "c"].map((id) => ({
  id,
  classId: "c",
  name: id,
  grade: 1 as const,
  rollNo: id,
  avatarTint: "teal" as const,
  createdAt: classroom.createdAt,
  lastAssessedAt: null,
})) satisfies Student[];

describe("rotation", () => {
  it("counts remaining students and school days", () => {
    const view = rotationView(classroom, students);
    expect(view.assessedCount).toBe(1);
    expect(view.remaining).toBe(2);
    expect(view.schoolDaysLeft).toBe(1);
  });

  it("starts a new rotation when everyone has been assessed", () => {
    let next = classroom;
    next = markAssessedInRotation(next, "b", 3);
    next = markAssessedInRotation(next, "c", 3);
    expect(next.assessedInRotationIds).toEqual([]);
  });
});
