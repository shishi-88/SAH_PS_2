import type { AggregatedGapReport, ClassSizeBand } from "@shared/api";
import { t, localizedGapType, type Language } from "@/lib/i18n";
import { getGapType } from "./competency-registry";
import { weeksBetween } from "./ids";
import { rotationView } from "./rotation";
import type {
  Classroom,
  GapUrgency,
  Grade,
  SkillGapRecord,
  Student,
  WorksheetInstance,
} from "./types";

export interface GapGroup {
  gapTypeId: string;
  label: string;
  subject: SkillGapRecord["subject"];
  studentIds: string[];
  studentCount: number;
  newlyDetectedCount: number;
  persistentCount: number;
  urgency: GapUrgency;
  oldestWeeks: number;
}

export interface SuggestedGroup {
  title: string;
  reason: string;
  gapTypeId: string;
  studentIds: string[];
}

export interface GradeClassStats {
  grade: Grade;
  /** Students enrolled in this grade. */
  total: number;
  /** Students with at least one completed assessment. */
  assessedCount: number;
  /** Active gaps whose reassessment date has passed. */
  dueCount: number;
  /** Most common active gap types, highest first. */
  topGapTypeIds: { gapTypeId: string; count: number }[];
}

/** Per-grade summary used by the Classes overview cards. */
export function gradeStats(
  students: Student[],
  gaps: SkillGapRecord[],
  grade: Grade,
  now = Date.now(),
): GradeClassStats {
  const inGrade = students.filter((s) => s.grade === grade);
  const ids = new Set(inGrade.map((s) => s.id));
  const gradeGaps = gaps.filter(
    (g) => g.status === "active" && ids.has(g.studentId),
  );
  const counts = new Map<string, number>();
  for (const g of gradeGaps) {
    counts.set(g.gapTypeId, (counts.get(g.gapTypeId) ?? 0) + 1);
  }
  const topGapTypeIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([gapTypeId, count]) => ({ gapTypeId, count }));
  return {
    grade,
    total: inGrade.length,
    assessedCount: inGrade.filter((s) => s.lastAssessedAt).length,
    dueCount: gradeGaps.filter(
      (g) => new Date(g.reassessmentDueAt).getTime() <= now,
    ).length,
    topGapTypeIds,
  };
}

export function urgencyForGap(gap: SkillGapRecord, now = Date.now()): GapUrgency {
  const weeks = weeksBetween(gap.firstDetectedAt, now);
  if (weeks >= 3) return "persistent";
  if (weeks >= 1) return "watch";
  return "new";
}

export function buildGapGroups(
  gaps: SkillGapRecord[],
  now = Date.now(),
): GapGroup[] {
  const map = new Map<
    string,
    { studentIds: Set<string>; oldest: number; newCount: number; persistentCount: number }
  >();

  for (const gap of gaps) {
    if (gap.status !== "active") continue;
    const entry = map.get(gap.gapTypeId) ?? {
      studentIds: new Set<string>(),
      oldest: Date.now(),
      newCount: 0,
      persistentCount: 0,
    };
    entry.studentIds.add(gap.studentId);
    entry.oldest = Math.min(entry.oldest, new Date(gap.firstDetectedAt).getTime());
    const urgency = urgencyForGap(gap, now);
    if (urgency === "new") entry.newCount += 1;
    if (urgency === "persistent") entry.persistentCount += 1;
    map.set(gap.gapTypeId, entry);
  }

  const groups: GapGroup[] = [];
  for (const [gapTypeId, entry] of map) {
    const type = getGapType(gapTypeId);
    if (!type) continue;
    const oldestWeeks = weeksBetween(new Date(entry.oldest).toISOString(), now);
    const urgency: GapUrgency =
      oldestWeeks >= 3 || entry.persistentCount > 0
        ? "persistent"
        : oldestWeeks >= 1
          ? "watch"
          : "new";
    groups.push({
      gapTypeId,
      label: type.label,
      subject: type.subject,
      studentIds: [...entry.studentIds],
      studentCount: entry.studentIds.size,
      newlyDetectedCount: entry.newCount,
      persistentCount: entry.persistentCount,
      urgency,
      oldestWeeks,
    });
  }

  const rank: Record<GapUrgency, number> = { persistent: 0, watch: 1, new: 2 };
  return groups.sort((a, b) => {
    if (rank[a.urgency] !== rank[b.urgency]) return rank[a.urgency] - rank[b.urgency];
    return b.studentCount - a.studentCount;
  });
}

export function suggestSmallGroups(
  groups: GapGroup[],
  limit = 3,
  lang: Language = "en",
): SuggestedGroup[] {
  return groups.slice(0, limit).map((g) => {
    const type = getGapType(g.gapTypeId);
    const label = type ? localizedGapType(type, lang).label : g.label;
    const title =
      lang === "hi" ? label.replace(/ अंतराल.*$/u, "") : label.replace(/ gap.*$/i, "");
    const n = g.studentCount;
    const reason =
      g.urgency === "persistent"
        ? t(lang, "sg.persistent", { n })
        : g.urgency === "watch"
          ? t(lang, "sg.watch", { n })
          : t(lang, "sg.new", { n });
    return {
      title,
      reason,
      gapTypeId: g.gapTypeId,
      studentIds: g.studentIds,
    };
  });
}

/**
 * Teacher-facing stage of one gap, derived from existing records.
 * - needs-practice: open gap whose latest sheet has not been marked practiced
 * - practicing: sheet practiced, reassessment not due yet
 * - ready: sheet practiced and the reassessment date has passed
 * - resolved: gap closed
 */
export type GapStage = "needs-practice" | "practicing" | "ready" | "resolved";

export function gapStage(
  gap: SkillGapRecord,
  worksheets: WorksheetInstance[],
  now = Date.now(),
): GapStage {
  if (gap.status === "resolved") return "resolved";
  const practiced = worksheets.some(
    (w) => w.gapRecordId === gap.id && w.status === "practiced",
  );
  const due = new Date(gap.reassessmentDueAt).getTime() <= now;
  if (practiced && due) return "ready";
  if (practiced) return "practicing";
  return "needs-practice";
}

export interface TodayGroupAction {
  gapTypeId: string;
  studentCount: number;
}

export interface TodayActions {
  /** Next students in the rotation without an open-gap action already. */
  assessStudents: Student[];
  /** Open gaps whose sheet is practiced and whose reassessment date has passed. */
  reassessGaps: SkillGapRecord[];
  /** Students with an open gap that has no practiced sheet yet. */
  practiceStudents: Student[];
  /** Top shared gap affecting 3+ students, if any. */
  group: TodayGroupAction | null;
  allClear: boolean;
}

/** Derives what the teacher should do today — no new storage, all from existing records. */
export function buildTodayActions(
  classroom: Classroom,
  students: Student[],
  gaps: SkillGapRecord[],
  worksheets: WorksheetInstance[],
  now = Date.now(),
): TodayActions {
  const readyGaps: SkillGapRecord[] = [];
  const practiceIds = new Set<string>();
  const busyIds = new Set<string>();
  for (const g of gaps) {
    const stage = gapStage(g, worksheets, now);
    if (stage === "ready") {
      readyGaps.push(g);
      busyIds.add(g.studentId);
    } else if (stage === "needs-practice") {
      practiceIds.add(g.studentId);
      busyIds.add(g.studentId);
    }
  }

  const rotation = rotationView(classroom, students);
  const assessStudents = rotation.remainingIds
    .filter((id) => !busyIds.has(id))
    .slice(0, rotation.studentsPerDay)
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is Student => Boolean(s));

  const practiceStudents = students.filter((s) => practiceIds.has(s.id));

  const topGroup = buildGapGroups(gaps, now).find((g) => g.studentCount >= 3);
  const group: TodayGroupAction | null = topGroup
    ? { gapTypeId: topGroup.gapTypeId, studentCount: topGroup.studentCount }
    : null;

  return {
    assessStudents,
    reassessGaps: readyGaps,
    practiceStudents,
    group,
    allClear:
      assessStudents.length === 0 &&
      readyGaps.length === 0 &&
      practiceStudents.length === 0 &&
      group === null,
  };
}

export function classSizeBand(count: number): ClassSizeBand {
  if (count <= 10) return "1-10";
  if (count <= 20) return "11-20";
  if (count <= 40) return "21-40";
  return "40+";
}

export function toAggregatedReport(
  students: Student[],
  gaps: SkillGapRecord[],
  now = new Date(),
): AggregatedGapReport {
  const groups = buildGapGroups(gaps, now.getTime());
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    classSizeBand: classSizeBand(students.length),
    activeStudentCount: students.length,
    gapTypes: groups.map((g) => ({
      gapTypeId: g.gapTypeId,
      label: g.label,
      subject: g.subject,
      studentCount: g.studentCount,
      newlyDetectedCount: g.newlyDetectedCount,
      persistentCount: g.persistentCount,
      grades: [
        ...new Set(
          g.studentIds
            .map((id) => students.find((s) => s.id === id)?.grade)
            .filter((n): n is Grade => typeof n === "number"),
        ),
      ].sort(),
    })),
  };
}
