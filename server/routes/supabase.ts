import type { Request, Response } from "express";
import { checkSupabaseHealth, isSupabaseConfigured } from "../supabase/supabase-client";
import { centralStore } from "../db/central-store";

export async function handleSupabaseStatus(_req: Request, res: Response) {
  const health = await checkSupabaseHealth();
  const localStats = {
    classes: centralStore.classes.size,
    students: centralStore.students.size,
    assessments: centralStore.assessments.size,
    learningGaps: centralStore.learningGaps.size,
    syncLogs: centralStore.syncLogs.length,
  };

  res.json({
    configured: health.configured,
    connected: health.connected,
    engine: health.connected ? "Supabase Cloud (PostgreSQL)" : "Central Local Store (Offline Fallback)",
    url: health.url,
    remoteCounts: health.counts,
    localCounts: localStats,
    error: health.error,
  });
}
