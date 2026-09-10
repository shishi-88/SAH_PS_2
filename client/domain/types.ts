export type Grade = 1 | 2 | 3;
export type Subject = "reading" | "numeracy";
export type GapLifecycle = "active" | "resolved";
/** Outcome of the latest reassessment of a still-open gap. */
export type GapOutcome = "improving" | "still-present";
export type GapUrgency = "new" | "watch" | "persistent";
export type WorksheetTier = 1 | 2 | 3;
export type MappingSource = "demo" | "verified";
export type TokenError = "wrong" | "skipped" | "hesitation";
export type AnalysisSource = "teacher-assisted" | "rule-engine" | "web-speech-assist";
export type AssessmentKind = "initial" | "reassessment";
export type AvatarTint = "teal" | "coral" | "yellow" | "lilac" | "sand" | "sage";

export interface Classroom {
  id: string;
  name: string;
  teacherLabel: string;
  /** School name captured during teacher setup (stable context). */
  schoolName?: string;
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
  /** Grades this prompt is appropriate for. */
  grades: Grade[];
  /** Skill category id, e.g. "cvc-words" — see assessment-categories. */
  category: string;
  title: string;
  instruction: string;
  displayText: string;
  tokens: PromptToken[];
  /** Hindi equivalents. Falls back to the English fields when absent. */
  titleHi?: string;
  instructionHi?: string;
  displayTextHi?: string;
  tokensHi?: PromptToken[];
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
  /** Set by reassessment: "improving" (fewer errors than last sample) or "still-present". */
  lastOutcome?: GapOutcome;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  currentTier: WorksheetTier;
  reassessmentDueAt: string;
  worksheetIds: string[];
  assessmentIds: string[];
}

export type WorksheetItemKind =
  | "read"
  | "write"
  | "circle"
  | "match"
  | "fill"
  | "sequence"
  | "solve";

export type WorksheetStatus = "assigned" | "practiced";

export interface WorksheetItem {
  prompt: string;
  promptHi?: string;
  hint?: string;
  /** Activity type used by the worksheet preview to pick a layout. */
  kind?: WorksheetItemKind;
}

export interface WorksheetInstance {
  id: string;
  studentId: string;
  gapRecordId: string;
  templateId: string;
  assignedAt: string;
  tier: WorksheetTier;
  /** Optional for snapshots saved before practice tracking existed. */
  status?: WorksheetStatus;
  practicedAt?: string;
  title: string;
  focus: string;
  items: WorksheetItem[];
  /** Hindi equivalents captured at assignment time. Falls back to English. */
  titleHi?: string;
  focusHi?: string;
  itemsHi?: WorksheetItem[];
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
  /** Hindi equivalents. Falls back to the English fields when absent. */
  labelHi?: string;
  descriptionHi?: string;
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
  /** Hindi equivalents. Falls back to the English fields when absent. */
  titleHi?: string;
  focusHi?: string;
  itemsHi?: WorksheetItem[];
}
