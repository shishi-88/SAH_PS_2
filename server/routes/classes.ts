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
  if (!body.id || !body.name) {
    return res.status(400).json({ error: "id and name are required" });
  }
  // Ownership: a teacher session may only create/update their own classes.
  if (session.scope !== "admin") {
    const existing = centralStore.getClass(body.id);
    if (existing && !centralStore.canAccessClass(session, body.id)) {
      return res.status(403).json({ error: "Not allowed to modify this class" });
    }
    body.teacherId = session.teacherId;
  }
  const result = centralStore.upsertClass(body);
  res.status(200).json({ data: result.entity, conflict: result.conflict });
}