import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  ClassEntity,
  StudentEntity,
  AssessmentEntity,
  LearningGapEntity,
  SyncLogEntry,
  TeacherEntity,
} from "../../shared/api";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith("http"));
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// Convert camelCase domain entities to snake_case for Supabase Postgres tables
export async function syncClassToSupabase(entity: ClassEntity): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("classes").upsert({
      id: entity.id,
      teacher_id: entity.teacherId,
      name: entity.name,
      grade_band: entity.gradeBand,
      students_per_day: entity.studentsPerDay,
      reassessment_days: entity.reassessmentDays,
      version: entity.version,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    });
    if (error) {
      console.warn("[Supabase] Failed to upsert class:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Supabase] Class upsert exception:", err);
    return false;
  }
}

export async function syncStudentToSupabase(entity: StudentEntity): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("students").upsert({
      id: entity.id,
      class_id: entity.classId,
      name: entity.name,
      grade: entity.grade,
      roll_no: entity.rollNo,
      avatar_tint: entity.avatarTint,
      is_archived: entity.isArchived,
      version: entity.version,
      last_assessed_at: entity.lastAssessedAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    });
    if (error) {
      console.warn("[Supabase] Failed to upsert student:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Supabase] Student upsert exception:", err);
    return false;
  }
}

export async function syncAssessmentToSupabase(entity: AssessmentEntity): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("assessments").upsert({
      id: entity.id,
      student_id: entity.studentId,
      class_id: entity.classId || null,
      subject: entity.subject,
      grade: entity.grade,
      prompt_id: entity.promptId,
      kind: entity.kind,
      related_gap_id: entity.relatedGapId || null,
      detected_gap_type_ids: entity.detectedGapTypeIds || [],
      evidence: entity.evidence || { observations: [] },
      analysis_source: entity.analysisSource,
      summary: entity.summary,
      version: entity.version,
      timestamp: entity.timestamp,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    });
    if (error) {
      console.warn("[Supabase] Failed to upsert assessment:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Supabase] Assessment upsert exception:", err);
    return false;
  }
}

export async function syncLearningGapToSupabase(entity: LearningGapEntity): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("learning_gaps").upsert({
      id: entity.id,
      student_id: entity.studentId,
      gap_type_id: entity.gapTypeId,
      subject: entity.subject,
      status: entity.status,
      current_tier: entity.currentTier,
      first_detected_at: entity.firstDetectedAt,
      last_detected_at: entity.lastDetectedAt,
      resolved_at: entity.resolvedAt || null,
      reassessment_due_at: entity.reassessmentDueAt,
      worksheet_ids: entity.worksheetIds || [],
      assessment_ids: entity.assessmentIds || [],
      version: entity.version,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    });
    if (error) {
      console.warn("[Supabase] Failed to upsert learning gap:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Supabase] Learning gap upsert exception:", err);
    return false;
  }
}

export async function syncLogToSupabase(log: SyncLogEntry): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("sync_logs").upsert({
      id: log.id,
      operation_id: log.operationId,
      entity_type: log.entityType,
      entity_id: log.entityId,
      operation: log.operation,
      client_id: log.clientId || null,
      status: log.status,
      client_version: log.clientVersion,
      server_version: log.serverVersion,
      received_at: log.receivedAt,
      details: log.details || null,
    });
    if (error) {
      console.warn("[Supabase] Failed to upsert sync log:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Supabase] Sync log upsert exception:", err);
    return false;
  }
}

export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  url?: string;
  counts?: {
    classes: number;
    students: number;
    assessments: number;
    learningGaps: number;
    syncLogs: number;
  };
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are not set. Running on local central vault.",
    };
  }

  const sb = getSupabase();
  if (!sb) {
    return { configured: true, connected: false, error: "Failed to initialize Supabase client" };
  }

  try {
    const [clsRes, stuRes, assRes, gapRes, logRes] = await Promise.all([
      sb.from("classes").select("id", { count: "exact", head: true }),
      sb.from("students").select("id", { count: "exact", head: true }),
      sb.from("assessments").select("id", { count: "exact", head: true }),
      sb.from("learning_gaps").select("id", { count: "exact", head: true }),
      sb.from("sync_logs").select("id", { count: "exact", head: true }),
    ]);

    return {
      configured: true,
      connected: !clsRes.error,
      url: supabaseUrl.replace(/\/\/[^@]+@/, "//"), // sanitize
      counts: {
        classes: clsRes.count ?? 0,
        students: stuRes.count ?? 0,
        assessments: assRes.count ?? 0,
        learningGaps: gapRes.count ?? 0,
        syncLogs: logRes.count ?? 0,
      },
      error: clsRes.error?.message,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      error: err instanceof Error ? err.message : "Supabase connection error",
    };
  }
}
