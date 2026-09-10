import { startOfWeek } from "./ids";
import type { Classroom, Student } from "./types";

export const DEFAULT_STUDENTS_PER_DAY = 5;

export interface RotationView {
  assessedCount: number;
  total: number;
  remaining: number;
  remainingIds: string[];
  schoolDaysLeft: number;
  studentsPerDay: number;
  percent: number;
}

export function rotationView(
  classroom: Classroom,
  students: Student[],
): RotationView {
  const safeStudents = Array.isArray(students) ? students : [];
  const total = safeStudents.length;
  const assessedList = Array.isArray(classroom?.assessedInRotationIds) ? classroom.assessedInRotationIds : [];
  const assessed = new Set(assessedList.filter((id) => safeStudents.some((s) => s.id === id)));
  const remainingIds = safeStudents.filter((s) => !assessed.has(s.id)).map((s) => s.id);
  const remaining = remainingIds.length;
  const perDay = classroom?.studentsPerDay || DEFAULT_STUDENTS_PER_DAY;
  const schoolDaysLeft = remaining === 0 ? 0 : Math.max(1, Math.ceil(remaining / perDay));
  return {
    assessedCount: assessed.size,
    total,
    remaining,
    remainingIds,
    schoolDaysLeft,
    studentsPerDay: perDay,
    percent: total === 0 ? 0 : Math.round((assessed.size / total) * 100),
  };
}

export function markAssessedInRotation(
  classroom: Classroom,
  studentId: string,
  studentCount: number,
): Classroom {
  const assessedList = Array.isArray(classroom?.assessedInRotationIds) ? classroom.assessedInRotationIds : [];
  const ids = new Set(assessedList);
  ids.add(studentId);
  const allDone = studentCount > 0 && ids.size >= studentCount;
  if (allDone) {
    return {
      ...classroom,
      assessedInRotationIds: [],
      rotationStartedAt: new Date().toISOString(),
    };
  }
  return { ...classroom, assessedInRotationIds: [...ids] };
}

export function assessedThisWeekCount(students: Student[], now = new Date()): number {
  const start = startOfWeek(now).getTime();
  return students.filter(
    (s) => s.lastAssessedAt && new Date(s.lastAssessedAt).getTime() >= start,
  ).length;
}
