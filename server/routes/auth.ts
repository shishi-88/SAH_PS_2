import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";
import type {
  RestoreSessionResponse,
  TeacherSetupRequest,
  TeacherSetupResponse,
} from "../../shared/api";

/**
 * First-time teacher setup on a trusted classroom device.
 * Associates teacher + school + classroom + device with stable IDs and
 * returns an opaque session token (stored client-side in the encrypted vault).
 */
export function handleTeacherSetup(req: Request, res: Response) {
  const body = (req.body ?? {}) as TeacherSetupRequest;
  const deviceId = String(body.deviceId ?? "").trim();
  const teacherName = String(body.teacherName ?? "").trim();
  const classroomName = body.classroomName ? String(body.classroomName).trim() : undefined;
  if (!deviceId || !teacherName) {
    return res
      .status(400)
      .json({ error: "deviceId and teacherName are required" });
  }

  try {
    const { session, teacher, classroom } = centralStore.setupTeacher({
      deviceId,
      teacherName,
      password: body.password ? String(body.password) : undefined,
      schoolName: body.schoolName ? String(body.schoolName).trim() : undefined,
      classroomName: classroomName || "Class 1–3 Primary Section",
    });

    const payload: TeacherSetupResponse = {
      sessionToken: session.token,
      deviceId,
      teacher,
      classroom,
    };
    return res.status(200).json({ data: payload });
  } catch (err: any) {
    if (err?.message === "AUTH_INVALID_PASSWORD") {
      return res.status(401).json({
        error: "Incorrect password for teacher. (Default demo password: teacher123)",
      });
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}

/**
 * Returning teacher on the same trusted device: restores the persisted
 * session/context without forcing a manual login. 401 when the token is
 * unknown or expired (e.g. after the server restarted without state).
 */
export function handleRestoreSession(req: Request, res: Response) {
  const body = (req.body ?? {}) as { sessionToken?: string; deviceId?: string };
  const token = String(body.sessionToken ?? "").trim();
  if (!token) {
    return res.status(400).json({ error: "sessionToken is required" });
  }
  const ctx = centralStore.getSessionContext(token);
  if (!ctx) {
    return res.status(401).json({ error: "Session is no longer valid" });
  }
  const payload: RestoreSessionResponse = {
    sessionToken: token,
    deviceId: ctx.session.deviceId,
    teacher: ctx.teacher,
    classroom: ctx.classroom,
  };
  res.status(200).json({ data: payload });
}

/** Intentionally end the session (e.g. Switch teacher / classroom). */
export function handleEndSession(req: Request, res: Response) {
  const body = (req.body ?? {}) as { sessionToken?: string };
  const token = String(body.sessionToken ?? "").trim();
  if (!token) {
    return res.status(400).json({ error: "sessionToken is required" });
  }
  centralStore.endSession(token);
  res.status(200).json({ data: { ok: true } });
}

/** School-level admin token used by the Central Web Portal dashboard. */
export function handleAdminSession(_req: Request, res: Response) {
  const ctx = centralStore.getAdminSession();
  res.status(200).json({
    data: {
      sessionToken: ctx.session.token,
      scope: ctx.session.scope,
      teacher: ctx.teacher,
      classroom: ctx.classroom,
    },
  });
}

/** Web Portal Executive & Teacher Login Gate. */
export function handlePortalLogin(req: Request, res: Response) {
  const body = req.body ?? {};
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // Check admin credentials
  const isSuperAdmin =
    (username === "admin" && password === "admin123") ||
    (username === "nipun" && password === "sahayak123");

  // Check teacher credentials from central store
  const matchedTeacher = Array.from(centralStore.teachers.values()).find(
    (t) =>
      t.name.toLowerCase() === username ||
      t.id.toLowerCase() === username ||
      (t.email && t.email.toLowerCase() === username)
  );

  const isTeacherValid =
    matchedTeacher &&
    (!matchedTeacher.password || matchedTeacher.password === password);

  if (!isSuperAdmin && !isTeacherValid) {
    return res.status(401).json({
      error:
        "Invalid portal credentials. Demo accounts: admin / admin123 or Prerna Sharma / teacher123",
    });
  }

  const ctx = centralStore.getAdminSession();
  return res.status(200).json({
    data: {
      sessionToken: ctx.session.token,
      user: {
        username: isSuperAdmin ? "Administrator" : matchedTeacher?.name || username,
        role: isSuperAdmin ? "Central Admin" : "Teacher Lead",
        schoolName: matchedTeacher?.schoolName || "GPS-104 Central Hub",
      },
    },
  });
}