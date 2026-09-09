import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";

export function handleListClasses(_req: Request, res: Response) {
  const classes = centralStore.listClasses();
  res.json({ data: classes, count: classes.length });
}

export function handleGetClass(req: Request, res: Response) {
  const id = String(req.params.id);
  const cls = centralStore.getClass(id);
  if (!cls) {
    return res.status(404).json({ error: "Class not found" });
  }
  res.json({ data: cls });
}

export function handleUpsertClass(req: Request, res: Response) {
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: "name is required" });
  }
  const id = body.id || (req.params.id ? String(req.params.id) : `class_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const result = centralStore.upsertClass({ ...body, id });
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}

export function handleDeleteClass(req: Request, res: Response) {
  const id = String(req.params.id);
  centralStore.classes.delete(id);
  res.status(200).json({ success: true, message: "Class deleted successfully" });
}
