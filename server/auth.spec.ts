import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { Server } from "node:http";
import { createServer } from "./index";
import { centralStore } from "./db/central-store";

function cleanStore() {
  centralStore.teachers.clear();
  centralStore.classes.clear();
  centralStore.students.clear();
  centralStore.assessments.clear();
  centralStore.learningGaps.clear();
  centralStore.syncLogs = [];
  centralStore.devices.clear();
  centralStore.sessions.clear();
  // restore the seeded demo teacher
  centralStore.teachers.set("tea_demo", {
    id: "tea_demo",
    name: "Prerna Sharma",
    email: "prerna.sharma@primaryschool.edu.in",
    schoolId: "GPS-104",
    schoolName: "Primary School, GPS-104",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

describe("Teacher sessions & backend ownership enforcement", () => {
  let server: Server;

  beforeEach(() => {
    cleanStore();
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  async function listen() {
    server = createServer().listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const addr = server.address();
    return `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 8080}`;
  }

  it("sets up a teacher/classroom/device with stable IDs and a working session", async () => {
    const ctx = centralStore.setupTeacher({
      deviceId: "dev-a",
      teacherName: "Asha Rani",
      schoolName: "GPS-201",
      classroomName: "Class 1–3 Morning",
    });
    expect(ctx.teacher.name).toBe("Asha Rani");
    expect(ctx.classroom.teacherId).toBe(ctx.teacher.id);

    // Re-running setup on the same device reuses the same teacher + classroom.
    const again = centralStore.setupTeacher({
      deviceId: "dev-a",
      teacherName: "Asha Rani",
      schoolName: "GPS-201",
      classroomName: "Class 1–3 Morning",
    });
    expect(again.teacher.id).toBe(ctx.teacher.id);
    expect(again.classroom.id).toBe(ctx.classroom.id);

    // The session restores.
    const restored = centralStore.getSessionContext(ctx.session.token);
    expect(restored?.teacher.id).toBe(ctx.teacher.id);
    expect(restored?.classroom.id).toBe(ctx.classroom.id);
  });

  it("rejects requests without a session token (401)", async () => {
    const url = await listen();
    const res = await fetch(`${url}/api/students`);
    expect(res.status).toBe(401);
    const classes = await fetch(`${url}/api/classes`);
    expect(classes.status).toBe(401);
    const gaps = await fetch(`${url}/api/learning-gaps`);
    expect(gaps.status).toBe(401);
  });

  it("prevents a teacher from reading another teacher's students", async () => {
    const url = await listen();
    const teacherA = centralStore.setupTeacher({
      deviceId: "dev-a",
      teacherName: "Asha Rani",
      schoolName: "GPS-201",
      classroomName: "Class 1–3 Morning",
    });
    const teacherB = centralStore.setupTeacher({
      deviceId: "dev-b",
      teacherName: "Bina Devi",
      schoolName: "GPS-202",
      classroomName: "Class 1–3 Evening",
    });
    centralStore.upsertStudent({
      id: "stu_a_1",
      classId: teacherA.classroom.id,
      name: "Child of A",
      grade: 1,
      rollNo: "01",
      version: 1,
    });

    // Teacher B lists students → sees none of teacher A's students.
    const listRes = await fetch(`${url}/api/students`, {
      headers: { Authorization: `Bearer ${teacherB.session.token}` },
    });
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as { data: unknown[]; count: number };
    expect(list.count).toBe(0);

    // Teacher B tries to read teacher A's student directly → 404.
    const getRes = await fetch(`${url}/api/students/stu_a_1`, {
      headers: { Authorization: `Bearer ${teacherB.session.token}` },
    });
    expect(getRes.status).toBe(404);

    // Teacher B tries to enroll a student into teacher A's class → 403.
    const postRes = await fetch(`${url}/api/students`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${teacherB.session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "stu_b_1",
        classId: teacherA.classroom.id,
        name: "Sneaky",
        grade: 2,
        rollNo: "02",
      }),
    });
    expect(postRes.status).toBe(403);

    // Teacher B tries to read teacher A's class → 404.
    const classRes = await fetch(`${url}/api/classes/${teacherA.classroom.id}`, {
      headers: { Authorization: `Bearer ${teacherB.session.token}` },
    });
    expect(classRes.status).toBe(404);

    // Teacher A still sees their own student.
    const own = await fetch(`${url}/api/students/stu_a_1`, {
      headers: { Authorization: `Bearer ${teacherA.session.token}` },
    });
    expect(own.status).toBe(200);
  });

  it("scopes assessment and gap routes to the owning teacher", async () => {
    const url = await listen();
    const teacherA = centralStore.setupTeacher({
      deviceId: "dev-a",
      teacherName: "Asha Rani",
      classroomName: "Class 1–3 Morning",
    });
    const teacherB = centralStore.setupTeacher({
      deviceId: "dev-b",
      teacherName: "Bina Devi",
      classroomName: "Class 1–3 Evening",
    });
    centralStore.upsertStudent({
      id: "stu_a_2",
      classId: teacherA.classroom.id,
      name: "Child A2",
      grade: 3,
      rollNo: "03",
      version: 1,
    });

    // Teacher B cannot read assessments or gaps for teacher A's student.
    const asmRes = await fetch(`${url}/api/assessments/stu_a_2`, {
      headers: { Authorization: `Bearer ${teacherB.session.token}` },
    });
    expect(asmRes.status).toBe(404);

    const gapRes = await fetch(`${url}/api/learning-gaps/stu_a_2`, {
      headers: { Authorization: `Bearer ${teacherB.session.token}` },
    });
    expect(gapRes.status).toBe(404);

    // Teacher B cannot POST an assessment for teacher A's student.
    const postAsm = await fetch(`${url}/api/assessments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${teacherB.session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "asm_x",
        studentId: "stu_a_2",
        subject: "reading",
        grade: 3,
        promptId: "p",
        timestamp: new Date().toISOString(),
        kind: "initial",
        detectedGapTypeIds: [],
        evidence: { observations: [] },
        analysisSource: "teacher-assisted",
        summary: "",
      }),
    });
    expect(postAsm.status).toBe(403);
  });

  it("ends a session on demand and rejects the old token afterwards", async () => {
    const url = await listen();
    const ctx = centralStore.setupTeacher({
      deviceId: "dev-a",
      teacherName: "Asha Rani",
      classroomName: "Class 1–3 Morning",
    });

    const endRes = await fetch(`${url}/api/auth/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: ctx.session.token }),
    });
    expect(endRes.status).toBe(200);

    const restore = await fetch(`${url}/api/auth/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: ctx.session.token }),
    });
    expect(restore.status).toBe(401);

    const students = await fetch(`${url}/api/students`, {
      headers: { Authorization: `Bearer ${ctx.session.token}` },
    });
    expect(students.status).toBe(401);
  });

  it("allows switching teachers on the same device without mutating previous teacher data", async () => {
    const url = await listen();

    // 1. Teacher A sets up on device 'shared-tablet'
    const setupARes = await fetch(`${url}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "shared-tablet",
        teacherName: "Asha Rani",
        schoolName: "GPS-101",
        classroomName: "Class 1 Morning",
      }),
    });
    expect(setupARes.status).toBe(200);
    const dataA = (await setupARes.json()).data;
    expect(dataA.teacher.name).toBe("Asha Rani");

    // Teacher A creates student
    centralStore.upsertStudent({
      id: "stu_asha_1",
      classId: dataA.classroom.id,
      name: "Asha's Student",
      grade: 1,
      rollNo: "01",
      version: 1,
    });

    // 2. Teacher A switches teacher (ends session)
    const endRes = await fetch(`${url}/api/auth/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: dataA.sessionToken }),
    });
    expect(endRes.status).toBe(200);

    // 3. Teacher B sets up on the SAME 'shared-tablet'
    const setupBRes = await fetch(`${url}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "shared-tablet",
        teacherName: "Bina Devi",
        schoolName: "GPS-101",
        classroomName: "Class 2 Afternoon",
      }),
    });
    expect(setupBRes.status).toBe(200);
    const dataB = (await setupBRes.json()).data;
    expect(dataB.teacher.name).toBe("Bina Devi");
    expect(dataB.teacher.id).not.toBe(dataA.teacher.id);
    expect(dataB.classroom.id).not.toBe(dataA.classroom.id);

    // 4. Teacher A's record was NOT mutated/overwritten
    const teacherAInStore = centralStore.teachers.get(dataA.teacher.id);
    expect(teacherAInStore?.name).toBe("Asha Rani");

    // 5. Teacher B cannot see Teacher A's student
    const listRes = await fetch(`${url}/api/students`, {
      headers: { Authorization: `Bearer ${dataB.sessionToken}` },
    });
    const listData = await listRes.json();
    expect(listData.count).toBe(0);
  });

  it("admin (portal) session sees all classes and students", async () => {
    const url = await listen();
    const admin = centralStore.getAdminSession();
    const teacherA = centralStore.setupTeacher({
      deviceId: "dev-a",
      teacherName: "Asha Rani",
      classroomName: "Class 1–3 Morning",
    });
    centralStore.upsertStudent({
      id: "stu_admin_1",
      classId: teacherA.classroom.id,
      name: "Child A",
      grade: 1,
      rollNo: "01",
      version: 1,
    });

    const adminRes = await fetch(`${url}/api/auth/admin/session`, { method: "POST" });
    expect(adminRes.status).toBe(200);
    const adminData = (await adminRes.json()) as {
      data: { sessionToken: string; scope: string };
    };
    expect(adminData.data.scope).toBe("admin");

    const students = await fetch(`${url}/api/students`, {
      headers: { Authorization: `Bearer ${admin.session.token}` },
    });
    expect(students.status).toBe(200);
    const body = (await students.json()) as { count: number };
    expect(body.count).toBe(1);
  });

  it("verifies teacher password and enforces 401 on incorrect password", async () => {
    const url = await listen();

    // Setup teacher with a specific password
    const setupRes = await fetch(`${url}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "dev-secure-1",
        teacherName: "Suman Verma",
        password: "secretpassword123",
      }),
    });
    expect(setupRes.status).toBe(200);

    // Attempt login from a different device with WRONG password
    const failRes = await fetch(`${url}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "dev-secure-2",
        teacherName: "Suman Verma",
        password: "wrongpassword",
      }),
    });
    expect(failRes.status).toBe(401);
    const failBody = await failRes.json();
    expect(failBody.error).toMatch(/incorrect password/i);

    // Login with CORRECT password
    const passRes = await fetch(`${url}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "dev-secure-2",
        teacherName: "Suman Verma",
        password: "secretpassword123",
      }),
    });
    expect(passRes.status).toBe(200);
    const passData = await passRes.json();
    expect(passData.data.teacher.name).toBe("Suman Verma");
  });

  it("authenticates web portal users via /api/auth/portal/login", async () => {
    const url = await listen();

    // 1. Invalid credentials
    const invalidRes = await fetch(`${url}/api/auth/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "fakeadmin",
        password: "badpassword",
      }),
    });
    expect(invalidRes.status).toBe(401);

    // 2. Superadmin login (admin / admin123)
    const adminRes = await fetch(`${url}/api/auth/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
      }),
    });
    expect(adminRes.status).toBe(200);
    const adminData = await adminRes.json();
    expect(adminData.data.user.role).toBe("Central Admin");
    expect(adminData.data.sessionToken).toBeDefined();

    // 3. Teacher lead login (Prerna Sharma / teacher123)
    const teacherRes = await fetch(`${url}/api/auth/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Prerna Sharma",
        password: "teacher123",
      }),
    });
    expect(teacherRes.status).toBe(200);
    const teacherData = await teacherRes.json();
    expect(teacherData.data.user.username).toBe("Prerna Sharma");
  });
});