import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";

export function handleListAllGaps(_req: Request, res: Response) {
  const gaps = centralStore.listLearningGaps();
  res.json({ data: gaps, count: gaps.length });
}

export function handleGetStudentGaps(req: Request, res: Response) {
  const studentId = String(req.params.studentId);
  const gaps = centralStore.getLearningGapsForStudent(studentId);
  res.json({ data: gaps, count: gaps.length });
}

export function handleUpsertLearningGap(req: Request, res: Response) {
  const body = req.body;
  if (!body.id || !body.studentId || !body.gapTypeId) {
    return res.status(400).json({ error: "id, studentId, and gapTypeId are required" });
  }
  const result = centralStore.upsertLearningGap(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}
