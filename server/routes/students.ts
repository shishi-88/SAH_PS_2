import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";
import { requireSession, currentSession } from "../auth";

export function handleListStudents(req: Request, res: Response) {
  const session = currentSession(res);
  const classId = req.query.classId as string | undefined;
  if (classId && !centralStore.canAccessClass(session, classId)) {
    return res.status(403).json({ error: "Not allowed to view this class" });
  }
  const allowed = centralStore.classIdsForSession(session);
  const students = centralStore
    .listStudents(classId)
    .filter((s) => allowed === null || allowed.has(s.classId));
  res.json({ data: students, count: students.length });
}

export function handleGetStudent(req: Request, res: Response) {
  const session = currentSession(res);
  const id = String(req.params.id);
  if (!centralStore.canAccessStudent(session, id)) {
    return res.status(404).json({ error: "Student not found" });
  }
  const student = centralStore.getStudent(id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json({ data: student });
}

export function handleUpsertStudent(req: Request, res: Response) {
  const session = currentSession(res);
  const body = req.body;
  if (!body.id || !body.name) {
    return res.status(400).json({ error: "id and name are required" });
  }
  // A student must belong to a class the session may touch.
  if (body.classId && !centralStore.canAccessClass(session, body.classId)) {
    return res.status(403).json({ error: "Not allowed to enroll in this class" });
  }
  if (session.scope !== "admin" && !body.classId) {
    return res.status(400).json({ error: "classId is required" });
  }
  const result = centralStore.upsertStudent(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}

export function handleArchiveStudent(req: Request, res: Response) {
  const session = currentSession(res);
  const id = String(req.params.id);
  if (!centralStore.canAccessStudent(session, id)) {
    return res.status(404).json({ error: "Student not found" });
  }
  const archived = centralStore.archiveStudent(id);
  if (!archived) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json({ data: archived });
}