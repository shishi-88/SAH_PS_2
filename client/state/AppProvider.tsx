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
import {
  markShare,
  outcomeFromShares,
  promptTokenCount,
} from "@/domain/diagnosis";
import { createId, daysFrom } from "@/domain/ids";
import { markAssessedInRotation } from "@/domain/rotation";
import { nextTier, selectWorksheetTemplate } from "@/domain/worksheet-bank";
import { toAggregatedReport } from "@/domain/class-overview";
import { t, type Language } from "@/lib/i18n";
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
  language: Language;
  setLanguage: (lang: Language) => void;
  snapshot: AppSnapshot;
  save: (next: AppSnapshot) => Promise<void>;
  updateClassroom: (patch: Partial<Classroom>) => Promise<void>;
  upsertStudent: (student: Omit<Student, "id" | "classId" | "createdAt" | "lastAssessedAt"> & { id?: string }) => Promise<Student>;
  removeStudent: (id: string) => Promise<void>;
  recordAssessment: (input: {
    studentId: string;
    assessment: Omit<Assessment, "id">;
    gapTypeId: string | null;
    relatedGapId?: string;
  }) => Promise<{ assessment: Assessment; gap: SkillGapRecord | null; worksheet: WorksheetInstance | null }>;
  resolveGap: (gapId: string) => Promise<void>;
  continueGap: (gapId: string) => Promise<WorksheetInstance | null>;
  markPracticed: (worksheetId: string) => Promise<void>;
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
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return localStorage.getItem("sahayak-lang") === "hi" ? "hi" : "en";
    } catch {
      return "en";
    }
  });
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

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem("sahayak-lang", lang);
    } catch {
      /* storage unavailable (private mode) — language stays for this session */
    }
    setLanguageState(lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
      language,
      setLanguage,
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

        const reassessmentDays = snapshot.classroom.reassessmentDays;
        const related =
          (relatedGapId ? gaps.find((g) => g.id === relatedGapId) : undefined) ?? null;
        const isReassessment = assessment.kind === "reassessment" || related !== null;
        const clean = assessment.evidence.observations.length === 0;

        if (isReassessment && related) {
          const sameGap = gapTypeId !== null && gapTypeId === related.gapTypeId;
          if (clean && !gapTypeId) {
            /* Clean reassessment → auto-resolve the gap. */
            gap = {
              ...related,
              status: "resolved",
              resolvedAt: now,
              lastOutcome: undefined,
              assessmentIds: [...related.assessmentIds, savedAssessment.id],
            };
            gaps = gaps.map((g) => (g.id === gap!.id ? gap! : g));
          } else if (sameGap) {
            /* Same gap confirmed → compare with the previous sample for this gap. */
            const prevId = related.assessmentIds[related.assessmentIds.length - 1];
            const prev = prevId
              ? snapshot.assessments.find((a) => a.id === prevId)
              : undefined;
            const currentShare = markShare(
              assessment.evidence.observations.length,
              promptTokenCount(assessment.promptId),
            );
            const previousShare = markShare(
              prev?.evidence.observations.length ?? 0,
              prev ? promptTokenCount(prev.promptId) : 0,
            );
            const improving =
              outcomeFromShares(previousShare, currentShare) === "improving";
            /* Improving keeps the same tier; still present moves to a harder tier. */
            const tier = improving
              ? related.currentTier
              : nextTier(related.currentTier);
            gap = {
              ...related,
              status: "active",
              resolvedAt: null,
              lastDetectedAt: now,
              currentTier: tier,
              lastOutcome: improving ? "improving" : "still-present",
              assessmentIds: [...related.assessmentIds, savedAssessment.id],
              reassessmentDueAt: daysFrom(now, reassessmentDays),
            };
            gaps = gaps.map((g) => (g.id === gap!.id ? gap! : g));
            if (!improving) {
              /* Still present → a harder sheet at the new tier. */
              const template = selectWorksheetTemplate(
                gap.gapTypeId,
                student.grade,
                gap.subject,
                tier,
              );
              if (template) {
                worksheet = personalizeSheet(template, student, gap, tier);
                worksheets = [...worksheets, worksheet];
                gap = {
                  ...gap,
                  worksheetIds: [...gap.worksheetIds, worksheet.id],
                };
                gaps = gaps.map((g) => (g.id === gap!.id ? gap! : g));
              }
            }
          } else if (gapTypeId) {
            /* A different gap now explains the errors → the old gap is superseded. */
            gaps = gaps.map((g) =>
              g.id === related.id
                ? {
                    ...g,
                    status: "resolved" as const,
                    resolvedAt: now,
                    assessmentIds: [...g.assessmentIds, savedAssessment.id],
                  }
                : g,
            );
          } else {
            /* Errors marked but no named gap → keep the gap open, reset the clock. */
            gap = {
              ...related,
              status: "active",
              resolvedAt: null,
              lastDetectedAt: now,
              assessmentIds: [...related.assessmentIds, savedAssessment.id],
              reassessmentDueAt: daysFrom(now, reassessmentDays),
            };
            gaps = gaps.map((g) => (g.id === gap!.id ? gap! : g));
          }
        }

        /* Create or update the gap for the chosen type (same-gap confirmations
           were already handled above). */
        if (gapTypeId && !(isReassessment && related && related.gapTypeId === gapTypeId)) {
          const type = getGapType(gapTypeId);
          const existing =
            gaps.find(
              (g) =>
                g.studentId === studentId &&
                g.gapTypeId === gapTypeId &&
                g.status === "active",
            ) ?? null;
          if (existing) {
            gap = {
              ...existing,
              lastDetectedAt: now,
              status: "active",
              resolvedAt: null,
              assessmentIds: [...existing.assessmentIds, savedAssessment.id],
              reassessmentDueAt: daysFrom(now, reassessmentDays),
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
              reassessmentDueAt: daysFrom(now, reassessmentDays),
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

        savedAssessment.relatedGapId = gap?.id ?? relatedGapId;
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
      markPracticed: async (worksheetId) => {
        const now = new Date().toISOString();
        await save({
          ...snapshot,
          worksheets: snapshot.worksheets.map((w) =>
            w.id === worksheetId
              ? { ...w, status: "practiced" as const, practicedAt: now }
              : w,
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
        let message = t(language, "sync.flushOk");
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
            message = t(language, "sync.flushFail");
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
  }, [ready, error, language, setLanguage, snapshot, save]);

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
    status: "assigned",
    title: template.title,
    focus: `${template.focus} · for ${student.name.split(" ")[0]}`,
    items: template.items,
    titleHi: template.titleHi,
    focusHi: template.focusHi ? `${template.focusHi} · ${student.name.split(" ")[0]} के लिए` : undefined,
    itemsHi: template.itemsHi,
  };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
