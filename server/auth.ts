import type { NextFunction, Request, Response } from "express";
import { centralStore } from "./db/central-store";
import type { TeacherSessionRecord } from "../shared/api";

export function sessionFromRequest(req: Request): TeacherSessionRecord | undefined {
  const header = req.headers.authorization;
  const token =
    (header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined) ||
    String(req.headers["x-session-token"] ?? "").trim() ||
    undefined;
  return token ? centralStore.getSession(token) : undefined;
}

/**
 * Guards teacher-scoped endpoints. Every class/student/assessment/gap
 * request must carry a valid session token; ownership is then enforced
 * per resource. This must never be bypassed by client-side filtering.
 */
export function requireSession(req: Request, res: Response, next: NextFunction) {
  const session = sessionFromRequest(req);
  if (!session) {
    return res.status(401).json({
      error: "A valid teacher session is required. Set up or restore your session first.",
    });
  }
  res.locals.session = session;
  next();
}

export function currentSession(res: Response): TeacherSessionRecord {
  return res.locals.session as TeacherSessionRecord;
}