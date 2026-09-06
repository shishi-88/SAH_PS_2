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
