import { randomBytes, randomUUID } from "node:crypto";
import type {
  ClassEntity,
  StudentEntity,
  AssessmentEntity,
  LearningGapEntity,
  SyncOperation,
  SyncOperationResult,
  SyncLogEntry,
  TeacherEntity,
  TeacherSessionRecord,
  DeviceBinding,
  SessionScope,
  TeacherSetupRequest,
} from "../../shared/api";
import {
  syncClassToSupabase,
  syncStudentToSupabase,
  syncAssessmentToSupabase,
  syncLearningGapToSupabase,
  syncLogToSupabase,
} from "../supabase/supabase-client";

const SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months on a trusted classroom device

export interface SessionContext {
  session: TeacherSessionRecord;
  teacher: TeacherEntity;
  classroom: ClassEntity;
}

class CentralStore {
  public teachers = new Map<string, TeacherEntity>();
  public classes = new Map<string, ClassEntity>();
  public students = new Map<string, StudentEntity>();
  public assessments = new Map<string, AssessmentEntity>();
  public learningGaps = new Map<string, LearningGapEntity>();
  public syncLogs: SyncLogEntry[] = [];
  /** Stable device → teacher/classroom binding (one per classroom device). */
  public devices = new Map<string, DeviceBinding>();
  /** Opaque bearer tokens → session records. */
  public sessions = new Map<string, TeacherSessionRecord>();

  constructor() {
    // Seed default teacher 1
    const defaultTeacher: TeacherEntity = {
      id: "tea_demo",
      name: "Prerna Sharma",
      email: "prerna.sharma@primaryschool.edu.in",
      password: "teacher123",
      schoolId: "GPS-104",
      schoolName: "Primary School, GPS-104",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.teachers.set(defaultTeacher.id, defaultTeacher);

    // Seed default teacher 2 (co-teacher for the SAME class)
    const teacher2: TeacherEntity = {
      id: "tea_rajesh",
      name: "Rajesh Verma",
      email: "rajesh.verma@primaryschool.edu.in",
      password: "teacher123",
      schoolId: "GPS-104",
      schoolName: "Primary School, GPS-104",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.teachers.set(teacher2.id, teacher2);

    // Seed initial demo data (classes, students, gaps)
    this.seedDemoData();
  }

  // ----------------------------------------------------------------
  // Teacher session / device management
  // ----------------------------------------------------------------

  private issueSession(
    deviceId: string,
    teacherId: string,
    classroomId: string,
    scope: SessionScope = "teacher",
  ): TeacherSessionRecord {
    const now = new Date();
    const token = randomBytes(32).toString("hex");
    const session: TeacherSessionRecord = {
      token,
      deviceId,
      teacherId,
      classroomId,
      scope,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    };
    this.sessions.set(token, session);
    return session;
  }

  /**
   * First-time (or repeated) teacher setup on a trusted classroom device.
   * Stable IDs: re-running setup on the same device reuses the same
   * teacher + classroom rather than creating duplicates.
   */
  public setupTeacher(input: TeacherSetupRequest): SessionContext {
    const now = new Date().toISOString();
    const reqTeacherName = input.teacherName.trim();
    const reqSchoolName = input.schoolName?.trim() || undefined;
    const reqClassroomName = input.classroomName?.trim() || "Class 1–3 Primary Section";

    const existingDevice = this.devices.get(input.deviceId);
    let teacher: TeacherEntity | undefined;
    let classroom: ClassEntity | undefined;

    // 1. Check if the device is currently bound to a teacher with the SAME name
    if (existingDevice) {
      const boundTeacher = this.teachers.get(existingDevice.teacherId);
      if (boundTeacher && boundTeacher.name.toLowerCase() === reqTeacherName.toLowerCase()) {
        teacher = boundTeacher;
        classroom = this.classes.get(existingDevice.classroomId);
      }
    }

    // 2. If not matched on device, find an existing teacher by name
    if (!teacher) {
      teacher = Array.from(this.teachers.values()).find(
        (t) => t.name.toLowerCase() === reqTeacherName.toLowerCase()
      );
    }

    const isBoundOnDevice = Boolean(
      existingDevice &&
      this.teachers.get(existingDevice.teacherId)?.name.toLowerCase() === reqTeacherName.toLowerCase()
    );

    // 2b. Password authentication check for existing teacher
    const reqPassword = input.password?.trim();
    if (teacher && teacher.password) {
      if (reqPassword) {
        if (teacher.password !== reqPassword) {
          throw new Error("AUTH_INVALID_PASSWORD");
        }
      } else if (!isBoundOnDevice) {
        throw new Error("AUTH_INVALID_PASSWORD");
      }
    }

    // 3. If teacher still not found, create a new teacher record
    if (!teacher) {
      teacher = this.makeTeacher(input, now);
      this.teachers.set(teacher.id, teacher);
    } else if (reqSchoolName && teacher.schoolName !== reqSchoolName) {
      teacher = {
        ...teacher,
        schoolName: reqSchoolName,
        updatedAt: now,
      };
      this.teachers.set(teacher.id, teacher);
    }

    // 4. Find matching classroom by name so co-teachers share the SAME class and students
    if (!classroom) {
      classroom = Array.from(this.classes.values()).find(
        (c) =>
          c.name.toLowerCase() === reqClassroomName.toLowerCase() ||
          c.name.toLowerCase().includes("primary section") ||
          c.name.toLowerCase().includes("class 1–3")
      );
    }

    if (!classroom) {
      classroom = this.makeClass(input, teacher.id, now);
      this.classes.set(classroom.id, classroom);
    }

    // 5. Bind device to this teacher + classroom
    this.devices.set(input.deviceId, {
      deviceId: input.deviceId,
      teacherId: teacher.id,
      classroomId: classroom.id,
      createdAt: now,
    });

    const session = this.issueSession(input.deviceId, teacher.id, classroom.id, "teacher");
    syncClassToSupabase(classroom).catch((e) => console.warn("[Supabase Sync Class]", e));
    return { session, teacher, classroom };
  }

  private makeTeacher(input: TeacherSetupRequest, now: string): TeacherEntity {
    return {
      id: `tea_${randomUUID()}`,
      name: input.teacherName.trim(),
      password: input.password?.trim() || undefined,
      schoolName: input.schoolName?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  private makeClass(input: TeacherSetupRequest, teacherId: string, now: string): ClassEntity {
    return {
      id: `cls_${randomUUID()}`,
      teacherId,
      name: input.classroomName?.trim() || "Class 1–3 Primary Section",
      gradeBand: "Classes 1-3",
      studentsPerDay: 5,
      reassessmentDays: 14,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  public getSession(token: string): TeacherSessionRecord | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(token);
      return undefined;
    }
    return session;
  }

  public getSessionContext(token: string): SessionContext | undefined {
    const session = this.getSession(token);
    if (!session) return undefined;
    const teacher = this.teachers.get(session.teacherId);
    const classroom = this.classes.get(session.classroomId);
    if (!teacher || !classroom) return undefined;
    return { session, teacher, classroom };
  }

  public endSession(token: string): boolean {
    const session = this.sessions.get(token);
    if (session) {
      this.devices.delete(session.deviceId);
      return this.sessions.delete(token);
    }
    return false;
  }

  /** Admin (portal) session bound to the seeded school-level teacher. */
  public getAdminSession(): SessionContext {
    const adminTeacher = this.teachers.get("tea_demo")!;
    const demoClass = Array.from(this.classes.values()).find(
      (c) => c.teacherId === "tea_demo",
    );
    const classroom =
      demoClass ??
      this.makeClass(
        { deviceId: "portal", teacherName: adminTeacher.name, classroomName: "Class 1–3 Primary Section" },
        "tea_demo",
        new Date().toISOString(),
      );
    if (!demoClass) this.classes.set(classroom.id, classroom);
    const session = this.issueSession("portal-device", "tea_demo", classroom.id, "admin");
    return { session, teacher: adminTeacher, classroom };
  }

  // ----------------------------------------------------------------
  // Ownership checks (enforced by route middleware — never client-only)
  // ----------------------------------------------------------------

  /** Admin scope sees everything; teachers only their own classes. */
  public canAccessClass(session: TeacherSessionRecord, classId: string): boolean {
    if (session.scope === "admin") return true;
    const cls = this.classes.get(classId);
    return Boolean(cls && cls.teacherId === session.teacherId);
  }

  /** Access to a student implies access to the class it belongs to. */
  public canAccessStudent(session: TeacherSessionRecord, studentId: string): boolean {
    if (session.scope === "admin") return true;
    const student = this.students.get(studentId);
    if (!student) return false;
    return this.canAccessClass(session, student.classId);
  }

  /** Class ids the session may touch (admin → all classes). */
  public classIdsForSession(session: TeacherSessionRecord): Set<string> | null {
    if (session.scope === "admin") return null; // null = unrestricted
    return new Set(
      Array.from(this.classes.values())
        .filter((c) => c.teacherId === session.teacherId)
        .map((c) => c.id),
    );
  }

  // --- Classes ---
  public upsertClass(data: Partial<ClassEntity> & { id: string }): { entity: ClassEntity; conflict: boolean } {
    const existing = this.classes.get(data.id);
    const now = new Date().toISOString();
    let conflict = false;

    if (existing && data.version && data.version < existing.version) {
      conflict = true;
    }

    const version = existing ? (conflict ? existing.version : (data.version ?? existing.version + 1)) : (data.version ?? 1);
    const entity: ClassEntity = {
      id: data.id,
      teacherId: data.teacherId ?? existing?.teacherId ?? "tea_demo",
      name: data.name ?? existing?.name ?? "Class 1–3 Primary Section",
      gradeBand: data.gradeBand ?? existing?.gradeBand ?? "Classes 1-3",
      studentsPerDay: data.studentsPerDay ?? existing?.studentsPerDay ?? 5,
      reassessmentDays: data.reassessmentDays ?? existing?.reassessmentDays ?? 14,
      version,
      createdAt: existing?.createdAt ?? data.createdAt ?? now,
      updatedAt: now,
    };

    if (!conflict) {
      this.classes.set(entity.id, entity);
      // Asynchronously mirror to Supabase
      syncClassToSupabase(entity).catch((e) => console.warn("[Supabase Sync Class]", e));
    }
    return { entity: existing && conflict ? existing : entity, conflict };
  }

  public getClass(id: string): ClassEntity | undefined {
    return this.classes.get(id);
  }

  public listClasses(): ClassEntity[] {
    return Array.from(this.classes.values());
  }

  // --- Students ---
  public upsertStudent(data: Partial<StudentEntity> & { id: string; name: string }): { entity: StudentEntity; conflict: boolean } {
    const existing = this.students.get(data.id);
    const now = new Date().toISOString();
    let conflict = false;

    if (existing && data.version && data.version < existing.version) {
      conflict = true;
    }

    const version = existing ? (conflict ? existing.version : (data.version ?? existing.version + 1)) : (data.version ?? 1);
    const entity: StudentEntity = {
      id: data.id,
      classId: data.classId ?? existing?.classId ?? "class_default",
      name: data.name,
      grade: data.grade ?? existing?.grade ?? 1,
      rollNo: data.rollNo ?? existing?.rollNo ?? "01",
      avatarTint: data.avatarTint ?? existing?.avatarTint ?? "teal",
      isArchived: data.isArchived ?? existing?.isArchived ?? false,
      version,
      createdAt: existing?.createdAt ?? data.createdAt ?? now,
      updatedAt: now,
      lastAssessedAt: data.lastAssessedAt !== undefined ? data.lastAssessedAt : (existing?.lastAssessedAt ?? null),
    };

    if (!conflict) {
      this.students.set(entity.id, entity);
      // Asynchronously mirror to Supabase
      syncStudentToSupabase(entity).catch((e) => console.warn("[Supabase Sync Student]", e));
    }
    return { entity: existing && conflict ? existing : entity, conflict };
  }

  public getStudent(id: string): StudentEntity | undefined {
    return this.students.get(id);
  }

  public listStudents(classId?: string): StudentEntity[] {
    const all = Array.from(this.students.values()).filter((s) => !s.isArchived);
    if (!classId) return all;
    return all.filter((s) => s.classId === classId);
  }

  public archiveStudent(id: string): StudentEntity | undefined {
    const student = this.students.get(id);
    if (!student) return undefined;
    student.isArchived = true;
    student.updatedAt = new Date().toISOString();
    student.version += 1;
    return student;
  }

  // --- Assessments ---
  public upsertAssessment(data: Partial<AssessmentEntity> & { id: string; studentId: string }): { entity: AssessmentEntity; conflict: boolean } {
    const existing = this.assessments.get(data.id);
    const now = new Date().toISOString();
    let conflict = false;

    if (existing && data.version && data.version < existing.version) {
      conflict = true;
    }

    const version = existing ? (conflict ? existing.version : (data.version ?? existing.version + 1)) : (data.version ?? 1);
    const entity: AssessmentEntity = {
      id: data.id,
      studentId: data.studentId,
      classId: data.classId ?? existing?.classId,
      subject: data.subject ?? existing?.subject ?? "reading",
      grade: data.grade ?? existing?.grade ?? 1,
      promptId: data.promptId ?? existing?.promptId ?? "",
      kind: data.kind ?? existing?.kind ?? "initial",
      relatedGapId: data.relatedGapId ?? existing?.relatedGapId,
      detectedGapTypeIds: data.detectedGapTypeIds ?? existing?.detectedGapTypeIds ?? [],
      evidence: data.evidence ?? existing?.evidence ?? { observations: [] },
      analysisSource: data.analysisSource ?? existing?.analysisSource ?? "teacher-assisted",
      summary: data.summary ?? existing?.summary ?? "",
      version,
      timestamp: data.timestamp ?? existing?.timestamp ?? now,
      createdAt: existing?.createdAt ?? data.createdAt ?? now,
      updatedAt: now,
    };

    if (!conflict) {
      this.assessments.set(entity.id, entity);
      // update student lastAssessedAt
      const student = this.students.get(entity.studentId);
      if (student) {
        student.lastAssessedAt = entity.timestamp;
        student.updatedAt = now;
        syncStudentToSupabase(student).catch((e) => console.warn("[Supabase Sync Student Assessment Date]", e));
      }
      // Asynchronously mirror to Supabase
      syncAssessmentToSupabase(entity).catch((e) => console.warn("[Supabase Sync Assessment]", e));
    }
    return { entity: existing && conflict ? existing : entity, conflict };
  }

  public getAssessmentsForStudent(studentId: string): AssessmentEntity[] {
    return Array.from(this.assessments.values())
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- Learning Gaps ---
  public upsertLearningGap(data: Partial<LearningGapEntity> & { id: string; studentId: string; gapTypeId: string }): { entity: LearningGapEntity; conflict: boolean } {
    const existing = this.learningGaps.get(data.id);
    const now = new Date().toISOString();
    let conflict = false;

    if (existing && data.version && data.version < existing.version) {
      conflict = true;
    }

    const version = existing ? (conflict ? existing.version : (data.version ?? existing.version + 1)) : (data.version ?? 1);
    const entity: LearningGapEntity = {
      id: data.id,
      studentId: data.studentId,
      gapTypeId: data.gapTypeId,
      subject: data.subject ?? existing?.subject ?? "reading",
      status: data.status ?? existing?.status ?? "active",
      currentTier: data.currentTier ?? existing?.currentTier ?? 1,
      firstDetectedAt: existing?.firstDetectedAt ?? data.firstDetectedAt ?? now,
      lastDetectedAt: data.lastDetectedAt ?? existing?.lastDetectedAt ?? now,
      resolvedAt: data.resolvedAt !== undefined ? data.resolvedAt : (existing?.resolvedAt ?? null),
      reassessmentDueAt: data.reassessmentDueAt ?? existing?.reassessmentDueAt ?? now,
      worksheetIds: data.worksheetIds ?? existing?.worksheetIds ?? [],
      assessmentIds: data.assessmentIds ?? existing?.assessmentIds ?? [],
      version,
      createdAt: existing?.createdAt ?? data.createdAt ?? now,
      updatedAt: now,
    };

    if (!conflict) {
      this.learningGaps.set(entity.id, entity);
      // Asynchronously mirror to Supabase
      syncLearningGapToSupabase(entity).catch((e) => console.warn("[Supabase Sync Learning Gap]", e));
    }
    return { entity: existing && conflict ? existing : entity, conflict };
  }

  public getLearningGapsForStudent(studentId: string): LearningGapEntity[] {
    return Array.from(this.learningGaps.values())
      .filter((g) => g.studentId === studentId);
  }

  public listLearningGaps(): LearningGapEntity[] {
    return Array.from(this.learningGaps.values());
  }

  public seedDemoData(): {
    classes: number;
    students: number;
    assessments: number;
    learningGaps: number;
    syncLogs: number;
  } {
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const daysFrom = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

    // 1. Classroom
    const demoClass: ClassEntity = {
      id: "cls_primary_fln",
      teacherId: "tea_demo",
      name: "Class 1–3 Primary Section (Morning)",
      gradeBand: "Classes 1-3",
      studentsPerDay: 5,
      reassessmentDays: 14,
      version: 1,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(1),
    };
    this.classes.set(demoClass.id, demoClass);
    syncClassToSupabase(demoClass).catch(() => {});

    // 2. Students (Grades 1, 2, 3)
    const demoStudentsData: Array<{ id: string; name: string; grade: 1 | 2 | 3; roll: string; tint: "teal" | "coral" | "sand" | "sage"; lastAssessed: number | null }> = [
      { id: "stu_01", name: "Ananya Verma", grade: 1, roll: "01", tint: "teal", lastAssessed: 2 },
      { id: "stu_02", name: "Rahul Kumar", grade: 1, roll: "02", tint: "coral", lastAssessed: 9 },
      { id: "stu_03", name: "Fatima Sheikh", grade: 2, roll: "03", tint: "sand", lastAssessed: 1 },
      { id: "stu_04", name: "Vivaan Singh", grade: 2, roll: "04", tint: "sage", lastAssessed: 14 },
      { id: "stu_05", name: "Meera Joshi", grade: 3, roll: "05", tint: "teal", lastAssessed: 3 },
      { id: "stu_06", name: "Aarav Patil", grade: 3, roll: "06", tint: "coral", lastAssessed: 28 },
      { id: "stu_07", name: "Sara Khan", grade: 1, roll: "07", tint: "sand", lastAssessed: 5 },
      { id: "stu_08", name: "Kabir Reddy", grade: 2, roll: "08", tint: "sage", lastAssessed: 4 },
      { id: "stu_09", name: "Diya Nair", grade: 1, roll: "09", tint: "teal", lastAssessed: 1 },
      { id: "stu_10", name: "Ishaan Mehta", grade: 3, roll: "10", tint: "coral", lastAssessed: null },
    ];

    for (const s of demoStudentsData) {
      const studentEntity: StudentEntity = {
        id: s.id,
        classId: demoClass.id,
        name: s.name,
        grade: s.grade,
        rollNo: s.roll,
        avatarTint: s.tint,
        isArchived: false,
        version: 1,
        lastAssessedAt: s.lastAssessed !== null ? daysAgo(s.lastAssessed) : null,
        createdAt: daysAgo(40),
        updatedAt: daysAgo(s.lastAssessed ?? 20),
      };
      this.students.set(studentEntity.id, studentEntity);
      syncStudentToSupabase(studentEntity).catch(() => {});
    }

    // 3. Learning Gaps
    const gapsData: Array<{ id: string; stuId: string; gapType: string; sub: "reading" | "numeracy"; tier: 1 | 2 | 3; days: number }> = [
      { id: "gap_01", stuId: "stu_01", gapType: "letter-sound-bd", sub: "reading", tier: 1, days: 20 },
      { id: "gap_02", stuId: "stu_02", gapType: "decade-9-10", sub: "numeracy", tier: 1, days: 9 },
      { id: "gap_03", stuId: "stu_03", gapType: "consonant-blend-bl-cl-st", sub: "reading", tier: 2, days: 25 },
      { id: "gap_04", stuId: "stu_03", gapType: "decade-29-30", sub: "numeracy", tier: 1, days: 6 },
      { id: "gap_05", stuId: "stu_04", gapType: "decade-29-30", sub: "numeracy", tier: 1, days: 14 },
      { id: "gap_06", stuId: "stu_05", gapType: "multisyllable-decoding", sub: "reading", tier: 1, days: 3 },
      { id: "gap_07", stuId: "stu_06", gapType: "place-value-tens-hundreds", sub: "numeracy", tier: 1, days: 28 },
      { id: "gap_08", stuId: "stu_08", gapType: "backward-counting", sub: "numeracy", tier: 1, days: 4 },
      { id: "gap_09", stuId: "stu_09", gapType: "sight-word-recall", sub: "reading", tier: 2, days: 32 },
    ];

    for (const g of gapsData) {
      const gapEntity: LearningGapEntity = {
        id: g.id,
        studentId: g.stuId,
        gapTypeId: g.gapType,
        subject: g.sub,
        status: "active",
        currentTier: g.tier,
        firstDetectedAt: daysAgo(g.days),
        lastDetectedAt: daysAgo(g.days),
        resolvedAt: null,
        reassessmentDueAt: daysFrom(14 - (g.days % 14)),
        worksheetIds: [`ws_${g.id}`],
        assessmentIds: [`asm_${g.id}`],
        version: 1,
        createdAt: daysAgo(g.days),
        updatedAt: daysAgo(1),
      };
      this.learningGaps.set(gapEntity.id, gapEntity);
      syncLearningGapToSupabase(gapEntity).catch(() => {});

      // 4. Corresponding Assessment Record
      const student = this.students.get(g.stuId);
      const assessmentEntity: AssessmentEntity = {
        id: `asm_${g.id}`,
        studentId: g.stuId,
        classId: demoClass.id,
        subject: g.sub,
        grade: student?.grade ?? 1,
        promptId: g.sub === "reading" ? "read-g1-boat" : "num-g2-decades",
        kind: "initial",
        relatedGapId: gapEntity.id,
        detectedGapTypeIds: [g.gapType],
        evidence: {
          observations: [{ tokenIndex: 2, error: "hesitation" }, { tokenIndex: 4, error: "wrong" }],
          notes: `Observed difficulty with ${g.gapType}. Scheduled for small-group circle remediation.`,
        },
        analysisSource: "teacher-assisted",
        summary: `Diagnostic assessment identified foundational need: ${g.gapType}`,
        version: 1,
        timestamp: daysAgo(g.days),
        createdAt: daysAgo(g.days),
        updatedAt: daysAgo(g.days),
      };
      this.assessments.set(assessmentEntity.id, assessmentEntity);
      syncAssessmentToSupabase(assessmentEntity).catch(() => {});
    }

    // 5. Initial Sync Audit Logs
    const sampleOps: Array<{ op: "CREATE" | "UPDATE"; type: "student" | "assessment" | "learning-gap"; id: string; ver: number }> = [
      { op: "CREATE", type: "student", id: "stu_01", ver: 1 },
      { op: "CREATE", type: "student", id: "stu_03", ver: 1 },
      { op: "CREATE", type: "learning-gap", id: "gap_03", ver: 1 },
      { op: "CREATE", type: "assessment", id: "asm_gap_03", ver: 1 },
      { op: "CREATE", type: "learning-gap", id: "gap_04", ver: 1 },
      { op: "CREATE", type: "learning-gap", id: "gap_05", ver: 1 },
    ];

    for (let i = 0; i < sampleOps.length; i++) {
      const item = sampleOps[i];
      const logEntry: SyncLogEntry = {
        id: `log_demo_${i + 1}`,
        operationId: `op_seed_${i + 1}`,
        entityType: item.type,
        entityId: item.id,
        operation: item.op,
        clientId: "teacher_mobile_pwa",
        status: "SYNCED",
        clientVersion: item.ver,
        serverVersion: item.ver,
        receivedAt: daysAgo(sampleOps.length - i),
        details: "Ingested via mobile sync queue",
      };
      this.syncLogs.unshift(logEntry);
      syncLogToSupabase(logEntry).catch(() => {});
    }

    return {
      classes: this.classes.size,
      students: this.students.size,
      assessments: this.assessments.size,
      learningGaps: this.learningGaps.size,
      syncLogs: this.syncLogs.length,
    };
  }

  // --- Sync Processor ---
  public processSyncOperation(op: SyncOperation, clientId?: string): SyncOperationResult {
    const now = new Date().toISOString();
    let status: "SYNCED" | "CONFLICT" | "FAILED" = "SYNCED";
    let serverVersion = 1;
    let error: string | undefined;

    try {
      if (op.operation === "DELETE") {
        if (op.entityType === "student") {
          this.archiveStudent(op.entityId);
        } else if (op.entityType === "class") {
          this.classes.delete(op.entityId);
        }
      } else {
        switch (op.entityType) {
          case "class": {
            const res = this.upsertClass({ ...op.payload, id: op.entityId, version: op.clientVersion });
            serverVersion = res.entity.version;
            if (res.conflict) status = "CONFLICT";
            break;
          }
          case "student": {
            const res = this.upsertStudent({ ...op.payload, id: op.entityId, version: op.clientVersion, name: op.payload.name || "Student" });
            serverVersion = res.entity.version;
            if (res.conflict) status = "CONFLICT";
            break;
          }
          case "assessment": {
            const res = this.upsertAssessment({ ...op.payload, id: op.entityId, version: op.clientVersion, studentId: op.payload.studentId });
            serverVersion = res.entity.version;
            if (res.conflict) status = "CONFLICT";
            break;
          }
          case "learning-gap": {
            const res = this.upsertLearningGap({ ...op.payload, id: op.entityId, version: op.clientVersion, studentId: op.payload.studentId, gapTypeId: op.payload.gapTypeId });
            serverVersion = res.entity.version;
            if (res.conflict) status = "CONFLICT";
            break;
          }
          default:
            status = "FAILED";
            error = `Unknown entity type: ${op.entityType}`;
        }
      }
    } catch (e) {
      status = "FAILED";
      error = e instanceof Error ? e.message : "Unknown sync processing error";
    }

    const logEntry: SyncLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      operationId: op.id,
      entityType: op.entityType,
      entityId: op.entityId,
      operation: op.operation,
      clientId,
      status,
      clientVersion: op.clientVersion,
      serverVersion,
      receivedAt: now,
      details: error,
    };
    this.syncLogs.unshift(logEntry);
    if (this.syncLogs.length > 200) this.syncLogs.pop();

    // Asynchronously mirror sync log to Supabase
    syncLogToSupabase(logEntry).catch((e) => console.warn("[Supabase Sync Log]", e));

    return {
      operationId: op.id,
      entityId: op.entityId,
      status,
      serverVersion,
      serverUpdatedAt: now,
      error,
    };
  }

  public getSyncLogs(): SyncLogEntry[] {
    return this.syncLogs;
  }
}

export const centralStore = new CentralStore();
