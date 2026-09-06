import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadSnapshot, saveSnapshot } from "@/data/storage";
import { createDemoSnapshot, emptyClassroom } from "@/data/seed";
import { getGapType } from "@/domain/competency-registry";
import { createId, daysFrom } from "@/domain/ids";
import { markAssessedInRotation } from "@/domain/rotation";
import { nextTier, selectWorksheetTemplate } from "@/domain/worksheet-bank";
import { toAggregatedReport } from "@/domain/class-overview";
import type {
  AppSnapshot,
  Assessment,
  Classroom,
  SkillGapRecord,
  Student,
  WorksheetInstance,
  WorksheetTier,
} from "@/domain/types";
import type { AggregatedGapReportResponse } from "@shared/api";

interface AppContextValue {
  ready: boolean;
  error: string | null;
  snapshot: AppSnapshot;
  save: (next: AppSnapshot) => Promise<void>;
  updateClassroom: (patch: Partial<Classroom>) => Promise<void>;
  upsertStudent: (student: Omit<Student, "id" | "classId" | "createdAt"> & { id?: string }) => Promise<Student>;
  removeStudent: (id: string) => Promise<void>;
  recordAssessment: (input: {
    studentId: string;
    assessment: Omit<Assessment, "id">;
    gapTypeId: string | null;
    relatedGapId?: string;
  }) => Promise<{ assessment: Assessment; gap: SkillGapRecord | null; worksheet: WorksheetInstance | null }>;
  resolveGap: (gapId: string) => Promise<void>;
  continueGap: (gapId: string) => Promise<WorksheetInstance | null>;
  queueSync: () => Promise<void>;
  flushSync: () => Promise<{ ok: boolean; message: string }>;
  reloadDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function persist(next: AppSnapshot): Promise<AppSnapshot> {
  const storageNote = await saveSnapshot(next);
  return { ...next, storageNote };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() => ({
    classroom: emptyClassroom(),
    students: [],
    assessments: [],
    gaps: [],
    worksheets: [],
    syncQueue: [],
    storageNote: "",
  }));

  const save = useCallback(async (next: AppSnapshot) => {
    const stored = await persist(next);
    setSnapshot(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadSnapshot();
        if (cancelled) return;
        if (loaded?.students) {
          setSnapshot(loaded);
        } else {
          const demo = createDemoSnapshot();
          const stored = await persist(demo);
          if (!cancelled) setSnapshot(stored);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not open local records.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AppContextValue>(() => {
    return {
      ready,
      error,
      snapshot,
      save,
      updateClassroom: async (patch) => {
        await save({ ...snapshot, classroom: { ...snapshot.classroom, ...patch } });
      },
      upsertStudent: async (input) => {
        const existing = input.id ? snapshot.students.find((s) => s.id === input.id) : undefined;
        const student: Student = existing
          ? { ...existing, name: input.name, grade: input.grade, rollNo: input.rollNo, avatarTint: input.avatarTint }
          : {
              id: createId("stu"),
              classId: snapshot.classroom.id,
              name: input.name,
              grade: input.grade,
              rollNo: input.rollNo,
              avatarTint: input.avatarTint,
              createdAt: new Date().toISOString(),
              lastAssessedAt: null,
            };
        const students = existing
          ? snapshot.students.map((s) => (s.id === student.id ? student : s))
          : [...snapshot.students, student];
        await save({ ...snapshot, students });
        return student;
      },
      removeStudent: async (id) => {
        await save({
          ...snapshot,
          students: snapshot.students.filter((s) => s.id !== id),
          assessments: snapshot.assessments.filter((a) => a.studentId !== id),
          gaps: snapshot.gaps.filter((g) => g.studentId !== id),
          worksheets: snapshot.worksheets.filter((w) => w.studentId !== id),
          classroom: {
            ...snapshot.classroom,
            assessedInRotationIds: snapshot.classroom.assessedInRotationIds.filter((x) => x !== id),
          },
        });
      },
      recordAssessment: async ({ studentId, assessment, gapTypeId, relatedGapId }) => {
        const now = new Date().toISOString();
        const savedAssessment: Assessment = { ...assessment, id: createId("asm") };
        const student = snapshot.students.find((s) => s.id === studentId);
        if (!student) throw new Error("Student not found");

        let gaps = [...snapshot.gaps];
        let worksheets = [...snapshot.worksheets];
        let gap: SkillGapRecord | null = null;
        let worksheet: WorksheetInstance | null = null;

        if (relatedGapId && !gapTypeId) {
          /* reassessment with no gap chosen handled by caller */
        }

        if (gapTypeId) {
          const type = getGapType(gapTypeId);
          const existing =
            gaps.find(
              (g) =>
                g.id === relatedGapId ||
                (g.studentId === studentId && g.gapTypeId === gapTypeId && g.status === "active"),
            ) ?? null;
          if (existing) {
            gap = {
              ...existing,
              lastDetectedAt: now,
              status: "active",
              resolvedAt: null,
              assessmentIds: [...existing.assessmentIds, savedAssessment.id],
              reassessmentDueAt: daysFrom(now, snapshot.classroom.reassessmentDays),
            };
            gaps = gaps.map((g) => (g.id === gap!.id ? gap! : g));
          } else if (type) {
            gap = {
              id: createId("gap"),
              studentId,
              gapTypeId,
              subject: type.subject,
              status: "active",
              firstDetectedAt: now,
              lastDetectedAt: now,
              resolvedAt: null,
              currentTier: 1,
              reassessmentDueAt: daysFrom(now, snapshot.classroom.reassessmentDays),
              worksheetIds: [],
              assessmentIds: [savedAssessment.id],
            };
            gaps = [...gaps, gap];
          }
          if (gap) {
            const template = selectWorksheetTemplate(
              gap.gapTypeId,
              student.grade,
              gap.subject,
              gap.currentTier,
            );
            if (template) {
              worksheet = personalizeSheet(template, student, gap, gap.currentTier);
              worksheets = [...worksheets, worksheet];
              gap = {
                ...gap,
                worksheetIds: [...gap.worksheetIds, worksheet.id],
              };
              gaps = gaps.map((g) => (g.id === gap!.id ? gap! : g));
            }
          }
        }

        savedAssessment.relatedGapId = gap?.id;
        const students = snapshot.students.map((s) =>
          s.id === studentId ? { ...s, lastAssessedAt: now } : s,
        );
        const classroom = markAssessedInRotation(
          snapshot.classroom,
          studentId,
          students.length,
        );

        await save({
          ...snapshot,
          students,
          classroom,
          assessments: [...snapshot.assessments, savedAssessment],
          gaps,
          worksheets,
        });
        return { assessment: savedAssessment, gap, worksheet };
      },
      resolveGap: async (gapId) => {
        const now = new Date().toISOString();
        await save({
          ...snapshot,
          gaps: snapshot.gaps.map((g) =>
            g.id === gapId
              ? { ...g, status: "resolved", resolvedAt: now }
              : g,
          ),
        });
      },
      continueGap: async (gapId) => {
        const existing = snapshot.gaps.find((g) => g.id === gapId);
        const student = snapshot.students.find((s) => s.id === existing?.studentId);
        if (!existing || !student) return null;
        const tier: WorksheetTier = nextTier(existing.currentTier);
        const template = selectWorksheetTemplate(
          existing.gapTypeId,
          student.grade,
          existing.subject,
          tier,
        );
        let worksheet: WorksheetInstance | null = null;
        let worksheets = snapshot.worksheets;
        let gap = {
          ...existing,
          status: "active" as const,
          resolvedAt: null,
          currentTier: tier,
          lastDetectedAt: new Date().toISOString(),
          reassessmentDueAt: daysFrom(new Date().toISOString(), snapshot.classroom.reassessmentDays),
        };
        if (template) {
          worksheet = personalizeSheet(template, student, gap, tier);
          worksheets = [...worksheets, worksheet];
          gap = { ...gap, worksheetIds: [...gap.worksheetIds, worksheet.id] };
        }
        await save({
          ...snapshot,
          worksheets,
          gaps: snapshot.gaps.map((g) => (g.id === gapId ? gap : g)),
        });
        return worksheet;
      },
      queueSync: async () => {
        const payload = toAggregatedReport(snapshot.students, snapshot.gaps);
        const item = {
          id: createId("sync"),
          createdAt: new Date().toISOString(),
          status: "pending" as const,
          payload,
        };
        await save({ ...snapshot, syncQueue: [...snapshot.syncQueue, item] });
      },
      flushSync: async () => {
        const pending = snapshot.syncQueue.filter((i) => i.status !== "synced");
        if (!pending.length) {
          const payload = toAggregatedReport(snapshot.students, snapshot.gaps);
          pending.push({
            id: createId("sync"),
            createdAt: new Date().toISOString(),
            status: "pending",
            payload,
          });
        }
        let queue = snapshot.syncQueue.some((i) => pending.find((p) => p.id === i.id))
          ? [...snapshot.syncQueue]
          : [...snapshot.syncQueue, ...pending];
        let ok = true;
        let message = "Synced anonymised gap counts.";
        for (const item of pending) {
          try {
            const res = await fetch("/api/reports/gaps", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload),
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const body = (await res.json()) as AggregatedGapReportResponse;
            queue = upsertQueue(queue, {
              ...item,
              status: "synced",
              syncedAt: body.receivedAt,
            });
          } catch (e) {
            ok = false;
            message =
              "Could not reach the reporting endpoint. The queue stays on this phone until you try again.";
            queue = upsertQueue(queue, {
              ...item,
              status: "failed",
              error: e instanceof Error ? e.message : "network",
            });
          }
        }
        await save({ ...snapshot, syncQueue: queue });
        return { ok, message };
      },
      reloadDemo: async () => {
        const demo = createDemoSnapshot();
        await save(demo);
      },
    };
  }, [ready, error, snapshot, save]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function upsertQueue(
  queue: AppSnapshot["syncQueue"],
  item: AppSnapshot["syncQueue"][number],
) {
  const exists = queue.some((q) => q.id === item.id);
  return exists ? queue.map((q) => (q.id === item.id ? item : q)) : [...queue, item];
}

function personalizeSheet(
  template: NonNullable<ReturnType<typeof selectWorksheetTemplate>>,
  student: Student,
  gap: SkillGapRecord,
  tier: WorksheetTier,
): WorksheetInstance {
  return {
    id: createId("ws"),
    studentId: student.id,
    gapRecordId: gap.id,
    templateId: template.id,
    assignedAt: new Date().toISOString(),
    tier,
    title: template.title,
    focus: `${template.focus} · for ${student.name.split(" ")[0]}`,
    items: template.items,
  };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
