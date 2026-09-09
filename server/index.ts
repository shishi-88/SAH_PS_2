import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo, handleSeedDemo } from "./routes/demo";
import { handleAggregatedGaps, handleListReports } from "./routes/reports";
import { handleListClasses, handleGetClass, handleUpsertClass } from "./routes/classes";
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
} from "./routes/auth";
import { requireSession } from "./auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check & Demo
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);
  app.post("/api/demo/seed", handleSeedDemo);

  // Teacher session / auth endpoints
  app.post("/api/auth/setup", handleTeacherSetup);
  app.post("/api/auth/restore", handleRestoreSession);
  app.post("/api/auth/end", handleEndSession);
  app.post("/api/auth/admin/session", handleAdminSession);

  // Class endpoints (teacher-scoped — every request needs a session)
  app.get("/api/classes", requireSession, handleListClasses);
  app.get("/api/classes/:id", requireSession, handleGetClass);
  app.post("/api/classes", requireSession, handleUpsertClass);
  app.put("/api/classes/:id", requireSession, handleUpsertClass);

  // Student endpoints
  app.get("/api/students", requireSession, handleListStudents);
  app.get("/api/students/:id", requireSession, handleGetStudent);
  app.post("/api/students", requireSession, handleUpsertStudent);
  app.put("/api/students/:id", requireSession, handleUpsertStudent);
  app.delete("/api/students/:id", requireSession, handleArchiveStudent);

  // Assessment endpoints
  app.get("/api/assessments/:studentId", requireSession, handleGetStudentAssessments);
  app.post("/api/assessments", requireSession, handleUpsertAssessment);

  // Learning Gap endpoints
  app.get("/api/learning-gaps", requireSession, handleListAllGaps);
  app.get("/api/learning-gaps/:studentId", requireSession, handleGetStudentGaps);
  app.post("/api/learning-gaps", requireSession, handleUpsertLearningGap);

  // Sync endpoints
  app.post("/api/sync", requireSession, handleBatchSync);
  app.get("/api/sync/logs", requireSession, handleGetSyncLogs);
  app.get("/api/supabase/status", handleSupabaseStatus);

  // Aggregate reports
  app.post("/api/reports/gaps", handleAggregatedGaps);
  app.get("/api/reports/gaps", handleListReports);

  return app;
}
