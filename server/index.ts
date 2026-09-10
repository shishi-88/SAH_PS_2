import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo, handleSeedDemo } from "./routes/demo";
import { handleAggregatedGaps, handleListReports } from "./routes/reports";
import { handleListClasses, handleGetClass, handleUpsertClass, handleDeleteClass } from "./routes/classes";
import { handleListStudents, handleGetStudent, handleUpsertStudent, handleArchiveStudent } from "./routes/students";
import { handleGetStudentAssessments, handleUpsertAssessment } from "./routes/assessments";
import { handleListAllGaps, handleGetStudentGaps, handleUpsertLearningGap } from "./routes/learning-gaps";
import { handleBatchSync, handleGetSyncLogs } from "./routes/sync";
import { handleSupabaseStatus } from "./routes/supabase";
import {
  handleTeacherSetup,
  handleRestoreSession,
  handleEndSession,
  handleAdminSession,
  handlePortalLogin,
} from "./routes/auth";
import { requireSession } from "./auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const apiRouter = express.Router();

  // Health check & Demo
  apiRouter.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  apiRouter.get("/demo", handleDemo);
  apiRouter.post("/demo/seed", handleSeedDemo);

  // Teacher & Portal session / auth endpoints
  apiRouter.post("/auth/setup", handleTeacherSetup);
  apiRouter.post("/auth/restore", handleRestoreSession);
  apiRouter.post("/auth/end", handleEndSession);
  apiRouter.post("/auth/admin/session", handleAdminSession);
  apiRouter.post("/auth/portal/login", handlePortalLogin);

  // Class endpoints (teacher-scoped — every request needs a session)
  apiRouter.get("/classes", requireSession, handleListClasses);
  apiRouter.get("/classes/:id", requireSession, handleGetClass);
  apiRouter.post("/classes", requireSession, handleUpsertClass);
  apiRouter.put("/classes/:id", requireSession, handleUpsertClass);
  apiRouter.delete("/classes/:id", requireSession, handleDeleteClass);

  // Student endpoints
  apiRouter.get("/students", requireSession, handleListStudents);
  apiRouter.get("/students/:id", requireSession, handleGetStudent);
  apiRouter.post("/students", requireSession, handleUpsertStudent);
  apiRouter.put("/students/:id", requireSession, handleUpsertStudent);
  apiRouter.delete("/students/:id", requireSession, handleArchiveStudent);

  // Assessment endpoints
  apiRouter.get("/assessments/:studentId", requireSession, handleGetStudentAssessments);
  apiRouter.post("/assessments", requireSession, handleUpsertAssessment);

  // Learning Gap endpoints
  apiRouter.get("/learning-gaps", requireSession, handleListAllGaps);
  apiRouter.get("/learning-gaps/:studentId", requireSession, handleGetStudentGaps);
  apiRouter.post("/learning-gaps", requireSession, handleUpsertLearningGap);

  // Sync endpoints
  apiRouter.post("/sync", requireSession, handleBatchSync);
  apiRouter.get("/sync/logs", requireSession, handleGetSyncLogs);
  apiRouter.get("/supabase/status", handleSupabaseStatus);

  // Aggregate reports
  apiRouter.post("/reports/gaps", handleAggregatedGaps);
  apiRouter.get("/reports/gaps", handleListReports);

  // Mount under /api as well as / (to handle Vercel rewrites seamlessly)
  app.use("/api", apiRouter);
  app.use("/", apiRouter);

  return app;
}
