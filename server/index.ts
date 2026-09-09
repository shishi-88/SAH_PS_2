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

  // Class endpoints
  app.get("/api/classes", handleListClasses);
  app.get("/api/classes/:id", handleGetClass);
  app.post("/api/classes", handleUpsertClass);
  app.put("/api/classes/:id", handleUpsertClass);

  // Student endpoints
  app.get("/api/students", handleListStudents);
  app.get("/api/students/:id", handleGetStudent);
  app.post("/api/students", handleUpsertStudent);
  app.put("/api/students/:id", handleUpsertStudent);
  app.delete("/api/students/:id", handleArchiveStudent);

  // Assessment endpoints
  app.get("/api/assessments/:studentId", handleGetStudentAssessments);
  app.post("/api/assessments", handleUpsertAssessment);

  // Learning Gap endpoints
  app.get("/api/learning-gaps", handleListAllGaps);
  app.get("/api/learning-gaps/:studentId", handleGetStudentGaps);
  app.post("/api/learning-gaps", handleUpsertLearningGap);

  // Sync endpoints
  app.post("/api/sync", handleBatchSync);
  app.get("/api/sync/logs", handleGetSyncLogs);
  app.get("/api/supabase/status", handleSupabaseStatus);

  // Aggregate reports
  app.post("/api/reports/gaps", handleAggregatedGaps);
  app.get("/api/reports/gaps", handleListReports);

  return app;
}
