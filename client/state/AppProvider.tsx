import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadSnapshot, saveSnapshot, loadSession, saveSession, clearSession } from "@/data/storage";
import { getOrCreateDeviceId } from "@/data/device";
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
import type { AggregatedGapReportResponse, TeacherSession } from "@shared/api";

export type AppPhase = "loading" | "setup" | "ready";

export interface TeacherSetupInput {
  teacherName: string;
  password?: string;
  schoolName?: string;
  classroomName?: string;
}

interface AppContextValue {
  ready: boolean;
  error: string | null;
  phase: AppPhase;
  session: TeacherSession | null;
  completeSetup: (input: TeacherSetupInput) => Promise<void>;
  switchTeacher: () => Promise<void>;
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
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [phase, setPhase] = useState<AppPhase>("loading");

  const save = useCallback(async (next: AppSnapshot) => {
    const stored = await persist(next);
    setSnapshot(stored);
    try {
      // Keep portal and mobile in sync in localStorage
      localStorage.setItem("sahayak_portal_students", JSON.stringify(stored.students));
      if (stored.classroom) {
        localStorage.setItem(
          "sahayak_portal_classes",
          JSON.stringify([
            {
              id: stored.classroom.id,
              teacherId: "tea_primary",
              name: stored.classroom.name,
              gradeBand: "Grade 1-3",
              studentsPerDay: stored.classroom.studentsPerDay,
              reassessmentDays: stored.classroom.reassessmentDays,
              version: 1,
              createdAt: stored.classroom.createdAt,
              updatedAt: new Date().toISOString(),
            },
          ]),
        );
      }
    } catch {}
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

  /* Background restore: refresh the persisted context from the server when
     reachable; stay fully usable offline otherwise. Only a server that
     explicitly rejects a previously-online session ends the session. */
  const tryRestore = useCallback(async (prev: TeacherSession) => {
    let res: Response;
    try {
      res = await fetch("/api/auth/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: prev.sessionToken }),
      });
    } catch {
      return; // offline — keep the local session untouched
    }
    if (res.status === 401) {
      if (prev.establishedOnline) {
        await clearSession();
        setSession(null);
        setPhase("setup");
      }
      return;
    }
    if (!res.ok) return;
    const d = (await res.json()) as {
      data?: {
        sessionToken: string;
        deviceId: string;
        teacher: { id: string; name: string; schoolName?: string };
        classroom: { id: string; name: string };
      };
    };
    const data = d.data;
    if (!data) return;
    const next: TeacherSession = {
      sessionToken: data.sessionToken,
      deviceId: data.deviceId,
      teacherId: data.teacher.id,
      classroomId: data.classroom.id,
      teacherName: data.teacher.name,
      schoolName: data.teacher.schoolName,
      classroomName: data.classroom.name,
      establishedAt: prev.establishedAt,
      establishedOnline: true,
    };
    setSession(next);
    await saveSession(next);
    setSnapshot((prevSnap) => ({
      ...prevSnap,
      classroom: {
        ...prevSnap.classroom,
        id: data.classroom.id,
        name: data.classroom.name,
        teacherLabel: data.teacher.name,
        schoolName: data.teacher.schoolName,
      },
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, loadedSession] = await Promise.all([loadSnapshot(), loadSession()]);
        if (cancelled) return;
        if (loaded?.students && loaded.students.length > 0) {
          // Merge any students added in portal via localStorage
          try {
            const portalSaved = localStorage.getItem("sahayak_portal_students");
            if (portalSaved) {
              const portalStudents: any[] = JSON.parse(portalSaved);
              const merged = [...loaded.students];
              for (const ps of portalStudents) {
                if (!merged.some((s) => s.id === ps.id)) {
                  merged.push({
                    id: ps.id,
                    classId: ps.classId || loaded.classroom.id,
                    name: ps.name,
                    grade: ps.grade || 2,
                    rollNo: ps.rollNo || "0",
                    avatarTint: ps.avatarTint || "teal",
                    createdAt: ps.createdAt || new Date().toISOString(),
                    lastAssessedAt: ps.lastAssessedAt || null,
                  });
                }
              }
              loaded.students = merged;
            }
          } catch {}
          setSnapshot(loaded);
        } else {
          // Check if portal already has students
          let initialStudents: Student[] = [];
          try {
            const portalSaved = localStorage.getItem("sahayak_portal_students");
            if (portalSaved) {
              const portalStudents: any[] = JSON.parse(portalSaved);
              initialStudents = portalStudents.map((ps) => ({
                id: ps.id,
                classId: ps.classId || "cls_101",
                name: ps.name,
                grade: ps.grade || 2,
                rollNo: ps.rollNo || "0",
                avatarTint: ps.avatarTint || "teal",
                createdAt: ps.createdAt || new Date().toISOString(),
                lastAssessedAt: ps.lastAssessedAt || null,
              }));
            }
          } catch {}

          const demo = createDemoSnapshot();
          if (initialStudents.length > 0) {
            demo.students = initialStudents;
          }
          const stored = await persist(demo);
          if (!cancelled) setSnapshot(stored);
        }

        if (loadedSession) {
          setSession(loadedSession);
          setPhase("ready");
          tryRestore(loadedSession).catch(() => {});
        } else {
          setPhase("setup");
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
  }, [tryRestore]);

  const completeSetup = useCallback(
    async (input: TeacherSetupInput) => {
      const deviceId = getOrCreateDeviceId();
      const classroomName = input.classroomName?.trim() || "Class 1–3 Primary Section (कक्षा 1–3)";
      let next: TeacherSession;
      try {
        const res = await fetch("/api/auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            teacherName: input.teacherName,
            password: input.password,
            schoolName: input.schoolName,
            classroomName,
          }),
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const d = (await res.json()) as {
          data: {
            sessionToken: string;
            deviceId: string;
            teacher: { id: string; name: string; schoolName?: string };
            classroom: { id: string; name: string };
          };
        };
        const data = d.data;
        next = {
          sessionToken: data.sessionToken,
          deviceId: data.deviceId,
          teacherId: data.teacher.id,
          classroomId: data.classroom.id,
          teacherName: data.teacher.name,
          schoolName: data.teacher.schoolName,
          classroomName: data.classroom.name,
          establishedAt: new Date().toISOString(),
          establishedOnline: true,
        };
      } catch {
        /* Offline first-run: keep the classroom usable locally. The context
           binds to real server IDs the next time the device is online. */
        const now = new Date().toISOString();
        next = {
          sessionToken: `local_${createId("tok")}`,
          deviceId,
          teacherId: `tea_${createId("local")}`,
          classroomId: `cls_${createId("local")}`,
          teacherName: input.teacherName.trim(),
          schoolName: input.schoolName?.trim() || undefined,
          classroomName,
          establishedAt: now,
          establishedOnline: false,
        };
      }
      await saveSession(next);
      setSession(next);
      let students: Student[] = [];
      if (next.establishedOnline) {
        try {
          const stuRes = await fetch("/api/students", {
            headers: { Authorization: `Bearer ${next.sessionToken}` },
          });
          if (stuRes.ok) {
            const stuData = await stuRes.json();
            if (Array.isArray(stuData.data) && stuData.data.length > 0) {
              students = stuData.data.map((s: any) => ({
                id: s.id,
                classId: s.classId || next.classroomId,
                name: s.name,
                grade: s.grade || 2,
                rollNo: s.rollNo || "0",
                avatarTint: s.avatarTint || "teal",
                createdAt: s.createdAt || new Date().toISOString(),
                lastAssessedAt: s.lastAssessedAt || null,
              }));
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (students.length === 0) {
        const matching = snapshot.students.filter((s) => s.classId === next.classroomId);
        if (matching.length > 0) {
          students = matching;
        } else {
          const demo = createDemoSnapshot();
          students = demo.students.map((s) => ({
            ...s,
            id: `stu_${createId("stu")}`,
            classId: next.classroomId,
          }));
        }
      }

      const nextClassroom: Classroom = {
        ...snapshot.classroom,
        id: next.classroomId,
        name: next.classroomName,
        teacherLabel: next.teacherName,
        schoolName: next.schoolName,
        assessedInRotationIds: Array.isArray(snapshot.classroom?.assessedInRotationIds)
          ? snapshot.classroom.assessedInRotationIds
          : [],
        studentsPerDay: snapshot.classroom?.studentsPerDay || 5,
        reassessmentDays: snapshot.classroom?.reassessmentDays || 14,
      };
      await save({ ...snapshot, classroom: nextClassroom, students });
      setPhase("ready");
    },
    [snapshot, save],
  );

  const switchTeacher = useCallback(async () => {
    const prev = session;
    setSession(null);
    setPhase("setup");
    await clearSession();
    if (prev?.establishedOnline) {
      try {
        await fetch("/api/auth/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: prev.sessionToken }),
        });
      } catch {
        /* offline — the local session is already cleared */
      }
    }
  }, [session]);

  const value = useMemo<AppContextValue>(() => {
    return {
      ready,
      error,
      phase,
      session,
      completeSetup,
      switchTeacher,
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
        let ok = true;
        let message = t(language, "sync.flushOk");

        // 1. Build and transmit full entity batch to /api/sync (Database & Supabase)
        try {
          const operations: any[] = [];

          // Classroom
          if (snapshot.classroom) {
            operations.push({
              id: createId("sync"),
              entityType: "class",
              entityId: snapshot.classroom.id,
              operation: "UPDATE",
              payload: {
                id: snapshot.classroom.id,
                teacherId: "tea_primary",
                name: snapshot.classroom.name,
                gradeBand: "Grade 1-3",
                studentsPerDay: snapshot.classroom.studentsPerDay,
                reassessmentDays: snapshot.classroom.reassessmentDays,
                version: 1,
                createdAt: snapshot.classroom.createdAt,
                updatedAt: new Date().toISOString(),
              },
              clientVersion: 1,
              clientUpdatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: "PENDING",
              retryCount: 0,
            });
          }

          // Students
          for (const s of snapshot.students) {
            operations.push({
              id: createId("sync"),
              entityType: "student",
              entityId: s.id,
              operation: "UPDATE",
              payload: {
                id: s.id,
                classId: s.classId || snapshot.classroom.id,
                name: s.name,
                grade: s.grade,
                rollNo: s.rollNo,
                avatarTint: s.avatarTint,
                version: 1,
                createdAt: s.createdAt,
                updatedAt: new Date().toISOString(),
                lastAssessedAt: s.lastAssessedAt,
              },
              clientVersion: 1,
              clientUpdatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: "PENDING",
              retryCount: 0,
            });
          }

          // Gaps
          for (const g of snapshot.gaps) {
            operations.push({
              id: createId("sync"),
              entityType: "learning-gap",
              entityId: g.id,
              operation: "UPDATE",
              payload: {
                id: g.id,
                studentId: g.studentId,
                gapTypeId: g.gapTypeId,
                subject: g.subject,
                status: g.status,
                currentTier: g.currentTier,
                firstDetectedAt: g.firstDetectedAt,
                lastDetectedAt: g.lastDetectedAt,
                resolvedAt: g.resolvedAt,
                reassessmentDueAt: g.reassessmentDueAt,
                worksheetIds: g.worksheetIds,
                assessmentIds: g.assessmentIds,
                version: 1,
                createdAt: g.firstDetectedAt,
                updatedAt: g.lastDetectedAt,
              },
              clientVersion: 1,
              clientUpdatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: "PENDING",
              retryCount: 0,
            });
          }

          // Assessments
          for (const a of snapshot.assessments) {
            operations.push({
              id: createId("sync"),
              entityType: "assessment",
              entityId: a.id,
              operation: "CREATE",
              payload: {
                id: a.id,
                studentId: a.studentId,
                classId: snapshot.classroom.id,
                subject: a.subject,
                grade: a.grade,
                promptId: a.promptId,
                kind: a.kind,
                relatedGapId: a.relatedGapId,
                detectedGapTypeIds: a.detectedGapTypeIds,
                evidence: a.evidence,
                analysisSource: a.analysisSource,
                summary: a.summary,
                version: 1,
                timestamp: a.timestamp,
                createdAt: a.timestamp,
                updatedAt: a.timestamp,
              },
              clientVersion: 1,
              clientUpdatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: "PENDING",
              retryCount: 0,
            });
          }

          if (operations.length > 0) {
            await fetch("/api/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId: "mobile_teacher_device",
                operations,
              }),
            });
          }
        } catch (e) {
          console.warn("Batch sync to /api/sync failed:", e);
        }

        // 2. Fetch central records from /api/students to merge new web additions
        let updatedStudents = [...snapshot.students];
        try {
          const res = await fetch("/api/students");
          if (res.ok) {
            const data = await res.json();
            const remoteStudents: any[] = data.data || [];
            if (remoteStudents.length > 0) {
              for (const rs of remoteStudents) {
                const idx = updatedStudents.findIndex((s) => s.id === rs.id);
                if (idx < 0) {
                  updatedStudents.push({
                    id: rs.id,
                    classId: rs.classId || snapshot.classroom.id,
                    name: rs.name,
                    grade: rs.grade || 2,
                    rollNo: rs.rollNo || "0",
                    avatarTint: rs.avatarTint || "teal",
                    createdAt: rs.createdAt || new Date().toISOString(),
                    lastAssessedAt: rs.lastAssessedAt || null,
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed to pull remote students:", e);
        }

        // 3. Process any pending queue items (such as aggregated gap reports)
        const pending = snapshot.syncQueue.filter((i) => i.status !== "synced");
        if (!pending.length) {
          const payload = toAggregatedReport(updatedStudents, snapshot.gaps);
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

        await save({ ...snapshot, students: updatedStudents, syncQueue: queue });
        return { ok, message };
      },
      reloadDemo: async () => {
        const demo = createDemoSnapshot();
        if (session?.classroomId) {
          /* Keep the demo bound to the current teacher/classroom context. */
          const classroom = {
            ...demo.classroom,
            id: session.classroomId,
            name: session.classroomName,
            teacherLabel: session.teacherName,
            schoolName: session.schoolName,
          };
          const students = demo.students.map((s) => ({ ...s, classId: session.classroomId }));
          await save({ ...demo, classroom, students });
        } else {
          await save(demo);
        }
      },
    };
  }, [
    ready,
    error,
    phase,
    session,
    completeSetup,
    switchTeacher,
    language,
    setLanguage,
    snapshot,
    save,
  ]);

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
