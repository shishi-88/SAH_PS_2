import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";
import { requireSession, currentSession } from "../auth";

export function handleListClasses(_req: Request, res: Response) {
  const session = currentSession(res);
  const allowed = centralStore.classIdsForSession(session);
  const classes = centralStore.listClasses().filter(
    (c) => allowed === null || allowed.has(c.id),
  );
  res.json({ data: classes, count: classes.length });
}

export function handleGetClass(req: Request, res: Response) {
  const session = currentSession(res);
  const id = String(req.params.id);
  if (!centralStore.canAccessClass(session, id)) {
    return res.status(404).json({ error: "Class not found" });
  }
  const cls = centralStore.getClass(id);
  if (!cls) {
    return res.status(404).json({ error: "Class not found" });
  }
  res.json({ data: cls });
}

export function handleUpsertClass(req: Request, res: Response) {
  const session = currentSession(res);
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: "name is required" });
  }
  const id = body.id || (req.params.id ? String(req.params.id) : `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  
  // Ownership: a teacher session may only create/update their own classes.
  if (session.scope !== "admin") {
    const existing = centralStore.getClass(id);
    if (existing && !centralStore.canAccessClass(session, id)) {
      return res.status(403).json({ error: "Not allowed to modify this class" });
    }
    body.teacherId = session.teacherId;
  }
  const result = centralStore.upsertClass({ ...body, id });
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}

export function handleDeleteClass(req: Request, res: Response) {
  const session = currentSession(res);
  const id = String(req.params.id);
  if (!centralStore.canAccessClass(session, id)) {
    return res.status(404).json({ error: "Class not found" });
  }
  centralStore.classes.delete(id);
  res.status(200).json({ success: true, message: "Class deleted successfully" });
}
