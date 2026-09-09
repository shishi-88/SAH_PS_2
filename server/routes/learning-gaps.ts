import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";
import { requireSession, currentSession } from "../auth";

export function handleListAllGaps(_req: Request, res: Response) {
  const session = currentSession(res);
  const allowed = centralStore.classIdsForSession(session);
  const gaps = centralStore
    .listLearningGaps()
    .filter((g) => {
      if (allowed === null) return true;
      const student = centralStore.getStudent(g.studentId);
      return Boolean(student && allowed.has(student.classId));
    });
  res.json({ data: gaps, count: gaps.length });
}

export function handleGetStudentGaps(req: Request, res: Response) {
  const session = currentSession(res);
  const studentId = String(req.params.studentId);
  if (!centralStore.canAccessStudent(session, studentId)) {
    return res.status(404).json({ error: "Student not found" });
  }
  const gaps = centralStore.getLearningGapsForStudent(studentId);
  res.json({ data: gaps, count: gaps.length });
}

export function handleUpsertLearningGap(req: Request, res: Response) {
  const session = currentSession(res);
  const body = req.body;
  if (!body.id || !body.studentId || !body.gapTypeId) {
    return res.status(400).json({ error: "id, studentId, and gapTypeId are required" });
  }
  if (!centralStore.canAccessStudent(session, body.studentId)) {
    return res.status(403).json({ error: "Not allowed to record a gap for this student" });
  }
  const result = centralStore.upsertLearningGap(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}