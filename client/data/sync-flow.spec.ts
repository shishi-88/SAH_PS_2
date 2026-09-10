import { describe, expect, it, beforeEach } from "vitest";
import { centralStore } from "../../server/db/central-store";
import { diagnose } from "../domain/diagnosis";
import { defaultPrompt, promptsFor } from "../domain/prompts";
import { selectWorksheetTemplate, nextTier } from "../domain/worksheet-bank";
import { createId } from "../domain/ids";
import type { SyncOperation, BatchSyncRequest } from "../../shared/api";

describe("Phase 9: Complete Offline → Online → Sync Data Flow", () => {
  beforeEach(() => {
    // Reset central store collections for clean test
    centralStore.classes.clear();
    centralStore.students.clear();
    centralStore.assessments.clear();
    centralStore.learningGaps.clear();
    centralStore.syncLogs = [];
  });

  it("executes the full offline assessment, diagnosis, worksheet, and central sync workflow", async () => {
    // 1. OFFLINE: Teacher creates a class and student on local device
    const classId = createId("class");
    const studentId = createId("stu");
    const localSyncQueue: SyncOperation[] = [];

    const localClass = {
      id: classId,
      teacherId: "tea_demo",
      name: "Class 2A - Foundational Section",
      gradeBand: "Class 2",
      studentsPerDay: 5,
      reassessmentDays: 14,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const localStudent = {
      id: studentId,
      classId,
      name: "Saanvi Rao",
      grade: 2 as const,
      rollNo: "15",
      avatarTint: "coral" as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAssessedAt: null,
    };

    // Queue offline creation operations
    localSyncQueue.push({
      id: createId("sync"),
      entityType: "class",
      entityId: classId,
      operation: "CREATE",
      payload: localClass,
      clientVersion: 1,
      clientUpdatedAt: localClass.updatedAt,
      createdAt: localClass.createdAt,
      status: "PENDING",
      retryCount: 0,
    });

    localSyncQueue.push({
      id: createId("sync"),
      entityType: "student",
      entityId: studentId,
      operation: "CREATE",
      payload: localStudent,
      clientVersion: 1,
      clientUpdatedAt: localStudent.updatedAt,
      createdAt: localStudent.createdAt,
      status: "PENDING",
      retryCount: 0,
    });

    expect(localSyncQueue).toHaveLength(2);
    expect(centralStore.getStudent(studentId)).toBeUndefined(); // Backend has not received it yet

    // 2. OFFLINE: Teacher conducts a reading assessment on the student
    const prompt = promptsFor("reading", 2).find((p) => p.id === "read-g2-crow") ?? defaultPrompt("reading", 2);
    // Student hesitates and struggles with consonant blends (clever, stones)
    const cleverIdx = prompt.tokens.findIndex((t) => t.text === "clever");
    const stonesIdx = prompt.tokens.findIndex((t) => t.text === "stones");

    const diag = diagnose(prompt, {
      observations: [
        { tokenIndex: cleverIdx, error: "wrong" },
        { tokenIndex: stonesIdx, error: "hesitation" },
      ],
      notes: "Hesitated on consonant blends at the start of words.",
    });

    expect(diag.primaryGapTypeId).toBe("consonant-blend-bl-cl-st");

    // 3. OFFLINE: Learning gap is identified and personalized Tier 1 worksheet is assigned
    const gapId = createId("gap");
    const assessmentId = createId("asm");
    const template = selectWorksheetTemplate(diag.primaryGapTypeId!, localStudent.grade, "reading", 1);
    expect(template).toBeDefined();
    expect(template?.tier).toBe(1);

    const localAssessment = {
      id: assessmentId,
      studentId,
      subject: "reading" as const,
      grade: localStudent.grade,
      promptId: prompt.id,
      timestamp: new Date().toISOString(),
      kind: "initial" as const,
      relatedGapId: gapId,
      evidence: {
        observations: [
          { tokenIndex: cleverIdx, error: "wrong" as const },
          { tokenIndex: stonesIdx, error: "hesitation" as const },
        ],
        notes: "Hesitated on consonant blends",
      },
      detectedGapTypeIds: [diag.primaryGapTypeId!],
      analysisSource: "rule-engine" as const,
      summary: diag.summary,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const localGap = {
      id: gapId,
      studentId,
      gapTypeId: diag.primaryGapTypeId!,
      subject: "reading" as const,
      status: "active" as const,
      currentTier: 1 as const,
      firstDetectedAt: new Date().toISOString(),
      lastDetectedAt: new Date().toISOString(),
      resolvedAt: null,
      reassessmentDueAt: new Date().toISOString(),
      worksheetIds: ["ws_instance_1"],
      assessmentIds: [assessmentId],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Queue assessment and learning gap operations
    localSyncQueue.push({
      id: createId("sync"),
      entityType: "assessment",
      entityId: assessmentId,
      operation: "CREATE",
      payload: localAssessment,
      clientVersion: 1,
      clientUpdatedAt: localAssessment.updatedAt,
      createdAt: localAssessment.createdAt,
      status: "PENDING",
      retryCount: 0,
    });

    localSyncQueue.push({
      id: createId("sync"),
      entityType: "learning-gap",
      entityId: gapId,
      operation: "CREATE",
      payload: localGap,
      clientVersion: 1,
      clientUpdatedAt: localGap.updatedAt,
      createdAt: localGap.createdAt,
      status: "PENDING",
      retryCount: 0,
    });

    expect(localSyncQueue).toHaveLength(4);

    // 4. ONLINE RECONNECTION: Sync engine transmits batch operations to central store
    const syncRequest: BatchSyncRequest = {
      clientId: "teacher_phone_001",
      operations: localSyncQueue,
    };

    const results = syncRequest.operations.map((op) => centralStore.processSyncOperation(op, syncRequest.clientId));
    expect(results.every((r) => r.status === "SYNCED")).toBe(true);

    // 5. VERIFY CENTRAL DATABASE STATE
    const syncedStudent = centralStore.getStudent(studentId);
    expect(syncedStudent).toBeDefined();
    expect(syncedStudent?.name).toBe("Saanvi Rao");

    const syncedAssessments = centralStore.getAssessmentsForStudent(studentId);
    expect(syncedAssessments).toHaveLength(1);
    expect(syncedAssessments[0].detectedGapTypeIds).toContain("consonant-blend-bl-cl-st");

    const syncedGaps = centralStore.getLearningGapsForStudent(studentId);
    expect(syncedGaps).toHaveLength(1);
    expect(syncedGaps[0].status).toBe("active");

    // 6. IDEMPOTENCY: Re-sending the exact same batch causes no duplicates
    const duplicateResults = syncRequest.operations.map((op) => centralStore.processSyncOperation(op, syncRequest.clientId));
    expect(duplicateResults.every((r) => r.status === "SYNCED")).toBe(true);
    expect(centralStore.listStudents()).toHaveLength(1);
    expect(centralStore.getAssessmentsForStudent(studentId)).toHaveLength(1);

    // 7. PROGRESSION & REASSESSMENT: Student practices and improves to Tier 2
    const nextT = nextTier(localGap.currentTier);
    expect(nextT).toBe(2);

    const updatedGap = {
      ...localGap,
      currentTier: nextT,
      version: 2,
      lastDetectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updateOp: SyncOperation = {
      id: createId("sync"),
      entityType: "learning-gap",
      entityId: gapId,
      operation: "UPDATE",
      payload: updatedGap,
      clientVersion: 2,
      clientUpdatedAt: updatedGap.updatedAt,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      retryCount: 0,
    };

    const updateRes = centralStore.processSyncOperation(updateOp, syncRequest.clientId);
    expect(updateRes.status).toBe("SYNCED");
    expect(centralStore.getLearningGapsForStudent(studentId)[0].currentTier).toBe(2);
  });

  it("exports and ingests complete offline bundle with students, assessments, and gaps", () => {
    const classId = createId("class");
    const studentId = createId("stu");
    const gapId = createId("gap");
    const asmId = createId("asm");

    const offlineBundle = {
      format: "sahayak-offline-bundle",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: "mobile-teacher-app",
      teacher: {
        id: "tea_demo",
        name: "Prerna Sharma",
        schoolName: "Primary School, GPS-104",
      },
      classroom: {
        id: classId,
        teacherId: "tea_demo",
        name: "Class 2B Offline Section",
        gradeBand: "Class 2",
        studentsPerDay: 5,
        reassessmentDays: 14,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      students: [
        {
          id: studentId,
          classId,
          name: "Rohan Patel",
          grade: 2 as const,
          rollNo: "07",
          avatarTint: "teal" as const,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastAssessedAt: new Date().toISOString(),
        },
      ],
      gaps: [
        {
          id: gapId,
          studentId,
          gapTypeId: "decade-9-10",
          subject: "numeracy" as const,
          status: "active" as const,
          currentTier: 1 as const,
          firstDetectedAt: new Date().toISOString(),
          lastDetectedAt: new Date().toISOString(),
          resolvedAt: null,
          reassessmentDueAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          worksheetIds: ["ws_rohan_1"],
          assessmentIds: [asmId],
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      assessments: [
        {
          id: asmId,
          studentId,
          classId,
          subject: "numeracy" as const,
          grade: 2 as const,
          promptId: "num-g2-decades",
          kind: "initial" as const,
          relatedGapId: gapId,
          detectedGapTypeIds: ["decade-9-10"],
          evidence: {
            observations: [{ tokenIndex: 2, error: "hesitation" as const }],
          },
          analysisSource: "teacher-assisted" as const,
          summary: "Struggled with transition across decade 9 to 10",
          version: 1,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      worksheets: [],
      syncQueue: [],
    };

    // Ingest into central store
    centralStore.upsertClass(offlineBundle.classroom);
    centralStore.upsertStudent(offlineBundle.students[0]);
    centralStore.upsertAssessment(offlineBundle.assessments[0]);
    centralStore.upsertLearningGap(offlineBundle.gaps[0]);

    // Verify central store reflects all offline data
    const student = centralStore.getStudent(studentId);
    expect(student).toBeDefined();
    expect(student?.name).toBe("Rohan Patel");

    const asm = centralStore.getAssessmentsForStudent(studentId);
    expect(asm).toHaveLength(1);
    expect(asm[0].detectedGapTypeIds).toContain("decade-9-10");

    const gaps = centralStore.getLearningGapsForStudent(studentId);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].gapTypeId).toBe("decade-9-10");
  });
});
