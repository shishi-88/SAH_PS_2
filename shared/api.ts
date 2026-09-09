export interface DemoResponse {
  message: string;
}

export type ClassSizeBand = "1-10" | "11-20" | "21-40" | "40+";

export interface AggregatedGapTypeCount {
  gapTypeId: string;
  label: string;
  subject: "reading" | "numeracy";
  studentCount: number;
  newlyDetectedCount: number;
  persistentCount: number;
  grades: number[];
}

/** Anonymised class-level report. Must never include student names or IDs. */
export interface AggregatedGapReport {
  schemaVersion: 1;
  generatedAt: string;
  classSizeBand: ClassSizeBand;
  activeStudentCount: number;
  gapTypes: AggregatedGapTypeCount[];
}

export interface AggregatedGapReportResponse {
  accepted: boolean;
  id: string;
  receivedAt: string;
}

// -------------------------------------------------------------
// Central Backend Entity Models (Entity-Level Synchronization)
// -------------------------------------------------------------

export interface TeacherEntity {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEntity {
  id: string;
  teacherId: string;
  name: string;
  gradeBand: string;
  studentsPerDay: number;
  reassessmentDays: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEntity {
  id: string;
  classId: string;
  name: string;
  grade: 1 | 2 | 3;
  rollNo: string;
  avatarTint?: "teal" | "coral" | "yellow" | "lilac" | "sand" | "sage";
  isArchived?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastAssessedAt: string | null;
}

export interface AssessmentEntity {
  id: string;
  studentId: string;
  classId?: string;
  subject: "reading" | "numeracy";
  grade: 1 | 2 | 3;
  promptId: string;
  kind: "initial" | "reassessment";
  relatedGapId?: string;
  detectedGapTypeIds: string[];
  evidence: {
    observations: Array<{ tokenIndex: number; error: "wrong" | "skipped" | "hesitation" }>;
    transcript?: string;
    notes?: string;
    recordingSeconds?: number;
  };
  analysisSource: "teacher-assisted" | "rule-engine" | "web-speech-assist";
  summary: string;
  version: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningGapEntity {
  id: string;
  studentId: string;
  gapTypeId: string;
  subject: "reading" | "numeracy";
  status: "active" | "resolved";
  currentTier: 1 | 2 | 3;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  reassessmentDueAt: string;
  worksheetIds: string[];
  assessmentIds: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type EntityType = "class" | "student" | "assessment" | "learning-gap";
export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";
export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT";

export interface SyncOperation {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: SyncOperationType;
  payload: Record<string, any>;
  clientVersion: number;
  clientUpdatedAt: string;
  createdAt: string;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  syncedAt?: string;
}

export interface BatchSyncRequest {
  clientId: string;
  operations: SyncOperation[];
}

export interface SyncOperationResult {
  operationId: string;
  entityId: string;
  status: "SYNCED" | "CONFLICT" | "FAILED";
  serverVersion: number;
  serverUpdatedAt: string;
  error?: string;
}

export interface BatchSyncResponse {
  success: boolean;
  processedCount: number;
  results: SyncOperationResult[];
  timestamp: string;
}

export interface SyncLogEntry {
  id: string;
  operationId: string;
  entityType: EntityType;
  entityId: string;
  operation: SyncOperationType;
  clientId?: string;
  status: "SYNCED" | "CONFLICT" | "FAILED";
  clientVersion: number;
  serverVersion: number;
  receivedAt: string;
  details?: string;
}

