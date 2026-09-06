export type Grade = 1 | 2 | 3;
export type Subject = "reading" | "numeracy";
export type GapLifecycle = "active" | "resolved";
export type GapUrgency = "new" | "watch" | "persistent";
export type WorksheetTier = 1 | 2 | 3;
export type MappingSource = "demo" | "verified";
export type TokenError = "wrong" | "skipped" | "hesitation";
export type AnalysisSource = "teacher-assisted" | "rule-engine" | "web-speech-assist";
export type AssessmentKind = "initial" | "reassessment";
export type AvatarTint = "teal" | "coral" | "sand" | "sage";

export interface Classroom {
  id: string;
  name: string;
  teacherLabel: string;
  reassessmentDays: 7 | 14;
  studentsPerDay: number;
  rotationStartedAt: string;
  assessedInRotationIds: string[];
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  grade: Grade;
  rollNo: string;
  avatarTint: AvatarTint;
  createdAt: string;
  lastAssessedAt: string | null;
}

export interface PromptToken {
  text: string;
  tags: string[];
}

export interface AssessmentPrompt {
  id: string;
  subject: Subject;
  grade: Grade;
  title: string;
  instruction: string;
  displayText: string;
  tokens: PromptToken[];
}

export interface TokenObservation {
  tokenIndex: number;
  error: TokenError;
}

export interface DiagnosisEvidence {
  observations: TokenObservation[];
  transcript?: string;
  notes?: string;
  recordingSeconds?: number;
}

export interface Assessment {
  id: string;
  studentId: string;
  subject: Subject;
  grade: Grade;
  promptId: string;
  timestamp: string;
  kind: AssessmentKind;
  relatedGapId?: string;
  evidence: DiagnosisEvidence;
  detectedGapTypeIds: string[];
  analysisSource: AnalysisSource;
  summary: string;
}

export interface SkillGapRecord {
  id: string;
  studentId: string;
  gapTypeId: string;
  subject: Subject;
  status: GapLifecycle;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  currentTier: WorksheetTier;
  reassessmentDueAt: string;
  worksheetIds: string[];
  assessmentIds: string[];
}

export interface WorksheetItem {
  prompt: string;
  hint?: string;
}

export interface WorksheetInstance {
  id: string;
  studentId: string;
  gapRecordId: string;
  templateId: string;
  assignedAt: string;
  tier: WorksheetTier;
  title: string;
  focus: string;
  items: WorksheetItem[];
}

export interface SyncQueueItem {
  id: string;
  createdAt: string;
  status: "pending" | "synced" | "failed";
  syncedAt?: string;
  error?: string;
  payload: import("@shared/api").AggregatedGapReport;
}

export interface AppSnapshot {
  classroom: Classroom;
  students: Student[];
  assessments: Assessment[];
  gaps: SkillGapRecord[];
  worksheets: WorksheetInstance[];
  syncQueue: SyncQueueItem[];
  storageNote: string;
}

export interface CompetencyGapType {
  id: string;
  subject: Subject;
  grades: Grade[];
  label: string;
  description: string;
  mappingSource: MappingSource;
  mappingNote: string;
  tags: string[];
}

export interface WorksheetTemplate {
  id: string;
  gapTypeId: string;
  subject: Subject;
  grades: Grade[];
  tier: WorksheetTier;
  title: string;
  focus: string;
  items: WorksheetItem[];
}
