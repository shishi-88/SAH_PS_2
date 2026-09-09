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

  // Class endpoints
  apiRouter.get("/classes", handleListClasses);
  apiRouter.get("/classes/:id", handleGetClass);
  apiRouter.post("/classes", handleUpsertClass);
  apiRouter.put("/classes/:id", handleUpsertClass);
  apiRouter.delete("/classes/:id", handleDeleteClass);

  // Student endpoints
  apiRouter.get("/students", handleListStudents);
  apiRouter.get("/students/:id", handleGetStudent);
  apiRouter.post("/students", handleUpsertStudent);
  apiRouter.put("/students/:id", handleUpsertStudent);
  apiRouter.delete("/students/:id", handleArchiveStudent);

  // Assessment endpoints
  apiRouter.get("/assessments/:studentId", handleGetStudentAssessments);
  apiRouter.post("/assessments", handleUpsertAssessment);

  // Learning Gap endpoints
  apiRouter.get("/learning-gaps", handleListAllGaps);
  apiRouter.get("/learning-gaps/:studentId", handleGetStudentGaps);
  apiRouter.post("/learning-gaps", handleUpsertLearningGap);

  // Sync endpoints
  apiRouter.post("/sync", handleBatchSync);
  apiRouter.get("/sync/logs", handleGetSyncLogs);
  apiRouter.get("/supabase/status", handleSupabaseStatus);

  // Aggregate reports
  apiRouter.post("/reports/gaps", handleAggregatedGaps);
  apiRouter.get("/reports/gaps", handleListReports);

  // Mount under /api as well as / (to handle Vercel rewrites seamlessly)
  app.use("/api", apiRouter);
  app.use("/", apiRouter);

  return app;
}
