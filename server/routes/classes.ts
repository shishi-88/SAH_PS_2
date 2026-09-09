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
  if (!body.id || !body.name) {
    return res.status(400).json({ error: "id and name are required" });
  }
  const result = centralStore.upsertClass(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}
