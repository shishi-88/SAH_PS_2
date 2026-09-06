import type { AggregatedGapReport, ClassSizeBand } from "@shared/api";
import { getGapType } from "./competency-registry";
import { weeksBetween } from "./ids";
import type { GapUrgency, SkillGapRecord, Student } from "./types";

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

export function suggestSmallGroups(groups: GapGroup[], limit = 3): SuggestedGroup[] {
  return groups.slice(0, limit).map((g) => ({
    title: g.label.replace(/ gap.*$/i, ""),
    reason:
      g.urgency === "persistent"
        ? `${g.studentCount} students · extra time needed (3+ weeks)`
        : g.urgency === "watch"
          ? `${g.studentCount} students · keep practising together`
          : `${g.studentCount} students · newly noticed this week`,
    gapTypeId: g.gapTypeId,
    studentIds: g.studentIds,
  }));
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
            .filter((n): n is number => typeof n === "number"),
        ),
      ].sort(),
    })),
  };
}
