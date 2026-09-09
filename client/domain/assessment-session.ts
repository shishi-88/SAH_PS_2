import type { Grade, Student } from "./types";

export interface ClassGroupedStudents {
  grade: Grade;
  students: Student[];
}

export interface AssessSessionOrder {
  /** Class 1 → Class 2 → Class 3 (empty classes omitted). */
  groups: ClassGroupedStudents[];
  /** Flattened session order (all students, never mixed across classes). */
  all: Student[];
}

/** Fisher–Yates shuffle; rng is injectable for deterministic tests. */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Builds the student order for ONE assessment session.
 *
 * Class sections are always ordered 1 → 2 → 3 and students are never mixed
 * across classes. Within each class the students are shuffled exactly once.
 *
 * Call this ONCE when a session starts and keep the returned value: the order
 * must stay stable for the whole session (rerenders, navigation, state
 * changes must not reshuffle). A new session calls this again and may get a
 * new random order.
 */
export function buildAssessSessionOrder(
  students: Student[],
  rng: () => number = Math.random,
): AssessSessionOrder {
  const grades: Grade[] = [1, 2, 3];
  const groups: ClassGroupedStudents[] = [];
  for (const grade of grades) {
    const inClass = shuffle(
      students.filter((s) => s.grade === grade),
      rng,
    );
    if (inClass.length > 0) groups.push({ grade, students: inClass });
  }
  return { groups, all: groups.flatMap((g) => g.students) };
}