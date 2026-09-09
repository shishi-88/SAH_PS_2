import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";

export function handleGetStudentAssessments(req: Request, res: Response) {
  const studentId = String(req.params.studentId);
  const assessments = centralStore.getAssessmentsForStudent(studentId);
  res.json({ data: assessments, count: assessments.length });
}

export function handleUpsertAssessment(req: Request, res: Response) {
  const body = req.body;
  if (!body.id || !body.studentId) {
    return res.status(400).json({ error: "id and studentId are required" });
  }
  const result = centralStore.upsertAssessment(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}
