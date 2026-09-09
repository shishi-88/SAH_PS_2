import type { Request, Response, RequestHandler } from "express";
import { DemoResponse } from "@shared/api";
import { centralStore } from "../db/central-store";

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};

export const handleSeedDemo = (_req: Request, res: Response) => {
  const stats = centralStore.seedDemoData();
  res.status(200).json({
    success: true,
    message: "Realistic FLN Class 1–3 demo dataset successfully seeded into central vault and Supabase!",
    stats,
  });
};

