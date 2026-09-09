import { describe, expect, it } from "vitest";
import { createServer } from "./index";
import { centralStore } from "./db/central-store";
import type { SyncOperation } from "../shared/api";

describe("Central Backend REST API & Sync Processor", () => {
  const app = createServer();

  it("upserts and lists classes idempotently", () => {
    const classId = "class_test_101";
    const res1 = centralStore.upsertClass({
      id: classId,
      name: "Class 2B - Primary",
      gradeBand: "Class 2",
      studentsPerDay: 5,
      version: 1,
    });
    expect(res1.entity.id).toBe(classId);
    expect(res1.conflict).toBe(false);

    // Idempotent retry with same version
    const res2 = centralStore.upsertClass({
      id: classId,
      name: "Class 2B - Primary",
      gradeBand: "Class 2",
      studentsPerDay: 5,
      version: 1,
    });
    expect(res2.entity.id).toBe(classId);
    expect(res2.conflict).toBe(false);

    const list = centralStore.listClasses();
    expect(list.some((c) => c.id === classId)).toBe(true);
  });

  it("upserts and retrieves students", () => {
    const stuId = "stu_test_201";
    const res = centralStore.upsertStudent({
      id: stuId,
      classId: "class_test_101",
      name: "Ayaan Mukherjee",
      grade: 2,
      rollNo: "12",
      avatarTint: "coral",
      version: 1,
    });
    expect(res.entity.name).toBe("Ayaan Mukherjee");

    const retrieved = centralStore.getStudent(stuId);
    expect(retrieved?.rollNo).toBe("12");
  });

  it("processes batch sync operations with duplicate protection", () => {
    const op: SyncOperation = {
      id: "sync_op_001",
      entityType: "student",
      entityId: "stu_test_301",
      operation: "CREATE",
      payload: {
        name: "Devika Sen",
        grade: 1,
        rollNo: "05",
        classId: "class_test_101",
      },
      clientVersion: 1,
      clientUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: "PENDING",
      retryCount: 0,
    };

    const res1 = centralStore.processSyncOperation(op, "phone_client_1");
    expect(res1.status).toBe("SYNCED");
    expect(res1.entityId).toBe("stu_test_301");

    // Repeat operation (idempotency check)
    const res2 = centralStore.processSyncOperation(op, "phone_client_1");
    expect(res2.status).toBe("SYNCED");

    const student = centralStore.getStudent("stu_test_301");
    expect(student?.name).toBe("Devika Sen");

    const logs = centralStore.getSyncLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].entityId).toBe("stu_test_301");
  });

  it("detects conflict when client sends an outdated version", () => {
    // Current version in store is 1
    const stuId = "stu_conflict_test";
    centralStore.upsertStudent({
      id: stuId,
      name: "Original Name",
      grade: 2,
      version: 5,
    });

    const staleOp: SyncOperation = {
      id: "sync_op_stale",
      entityType: "student",
      entityId: stuId,
      operation: "UPDATE",
      payload: { name: "Stale Overwrite" },
      clientVersion: 3, // Outdated version
      clientUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: "PENDING",
      retryCount: 0,
    };

    const res = centralStore.processSyncOperation(staleOp, "client_b");
    expect(res.status).toBe("CONFLICT");
    expect(centralStore.getStudent(stuId)?.name).toBe("Original Name");
  });
});
