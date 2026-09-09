import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";

export function handleListStudents(req: Request, res: Response) {
  const classId = req.query.classId as string | undefined;
  const students = centralStore.listStudents(classId);
  res.json({ data: students, count: students.length });
}

export function handleGetStudent(req: Request, res: Response) {
  const id = String(req.params.id);
  const student = centralStore.getStudent(id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json({ data: student });
}

export function handleUpsertStudent(req: Request, res: Response) {
  const body = req.body;
  if (!body.id || !body.name) {
    return res.status(400).json({ error: "id and name are required" });
  }
  const result = centralStore.upsertStudent(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}

export function handleArchiveStudent(req: Request, res: Response) {
  const id = String(req.params.id);
  const archived = centralStore.archiveStudent(id);
  if (!archived) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json({ data: archived });
}
