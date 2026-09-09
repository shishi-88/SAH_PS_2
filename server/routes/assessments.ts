import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";
import { requireSession, currentSession } from "../auth";

export function handleGetStudentAssessments(req: Request, res: Response) {
  const session = currentSession(res);
  const studentId = String(req.params.studentId);
  if (!centralStore.canAccessStudent(session, studentId)) {
    return res.status(404).json({ error: "Student not found" });
  }
  const assessments = centralStore.getAssessmentsForStudent(studentId);
  res.json({ data: assessments, count: assessments.length });
}

export function handleUpsertAssessment(req: Request, res: Response) {
  const session = currentSession(res);
  const body = req.body;
  if (!body.id || !body.studentId) {
    return res.status(400).json({ error: "id and studentId are required" });
  }
  if (!centralStore.canAccessStudent(session, body.studentId)) {
    return res.status(403).json({ error: "Not allowed to assess this student" });
  }
  const result = centralStore.upsertAssessment(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}