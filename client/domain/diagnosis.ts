import { COMPETENCY_GAP_TYPES, getGapType } from "./competency-registry";
import type {
  AnalysisSource,
  AssessmentPrompt,
  DiagnosisEvidence,
  Grade,
  Subject,
} from "./types";

export interface DiagnosisResult {
  gapTypeIds: string[];
  primaryGapTypeId: string | null;
  summary: string;
  analysisSource: AnalysisSource;
  evidenceNotes: string[];
}

const MIN_MARKS_FOR_TAG = 1;

function taggedErrorCount(
  prompt: AssessmentPrompt,
  evidence: DiagnosisEvidence,
  tagPrefix: string,
): number {
  let n = 0;
  for (const obs of evidence.observations) {
    const token = prompt.tokens[obs.tokenIndex];
    if (!token) continue;
    if (token.tags.some((t) => t === tagPrefix || t.startsWith(tagPrefix))) n += 1;
  }
  return n;
}

function positionShare(
  prompt: AssessmentPrompt,
  evidence: DiagnosisEvidence,
  position: "begin" | "end",
): number {
  const marked = evidence.observations.length;
  if (!marked) return 0;
  const hits = taggedErrorCount(prompt, evidence, `position:${position}`);
  return hits / marked;
}

export function matchTranscriptToObservations(
  prompt: AssessmentPrompt,
  transcript: string,
): DiagnosisEvidence {
  const spoken = transcript
    .toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const observations = prompt.tokens.flatMap((token, index) => {
    const expected = token.text.toLowerCase().replace(/[.,!?;:]/g, "");
    const found = spoken.includes(expected);
    return found ? [] : [{ tokenIndex: index, error: "wrong" as const }];
  });
  return {
    observations,
    transcript,
  };
}

export function diagnose(
  prompt: AssessmentPrompt,
  evidence: DiagnosisEvidence,
  options?: { transcriptFromWebSpeech?: boolean },
): DiagnosisResult {
  const source: AnalysisSource = options?.transcriptFromWebSpeech
    ? "web-speech-assist"
    : evidence.observations.length
      ? "rule-engine"
      : "teacher-assisted";

  if (evidence.observations.length === 0 && !evidence.transcript) {
    return {
      gapTypeIds: [],
      primaryGapTypeId: null,
      summary:
        "No specific errors were marked on this sample. You can choose a gap from the list, or save this as a clear sample.",
      analysisSource: "teacher-assisted",
      evidenceNotes: [],
    };
  }

  const scores = new Map<string, number>();
  const notes: string[] = [];

  for (const gap of COMPETENCY_GAP_TYPES) {
    if (gap.subject !== prompt.subject) continue;
    if (!gap.grades.includes(prompt.grade)) continue;
    let score = 0;
    for (const tag of gap.tags) {
      score += taggedErrorCount(prompt, evidence, tag);
    }
    if (score >= MIN_MARKS_FOR_TAG) scores.set(gap.id, score);
  }

  if (prompt.subject === "reading") {
    const beginShare = positionShare(prompt, evidence, "begin");
    const endShare = positionShare(prompt, evidence, "end");
    const specificHits = [...scores.entries()].filter(
      ([id, n]) => n > 0 && !id.startsWith("word-position"),
    );
    if (specificHits.length === 0 && evidence.observations.length >= 2) {
      if (beginShare >= 0.45) {
        scores.set("word-position-begin", 2);
        notes.push("Errors clustered at the beginning of words.");
      }
      if (endShare >= 0.45) {
        scores.set("word-position-end", 2);
        notes.push("Errors clustered at the ends of words.");
      }
    } else {
      if (beginShare >= 0.45) notes.push("Some slips were at the beginning of words.");
      if (endShare >= 0.45) notes.push("Some slips were at the ends of words.");
    }
    const hesitations = evidence.observations.filter((o) => o.error === "hesitation").length;
    if (hesitations >= 2) {
      notes.push(`${hesitations} long pauses were marked.`);
      if (taggedErrorCount(prompt, evidence, "multisyllable") >= 1) {
        scores.set(
          "multisyllable-decoding",
          (scores.get("multisyllable-decoding") ?? 0) + hesitations,
        );
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const gapTypeIds = ranked.slice(0, 3).map(([id]) => id);
  const primary = gapTypeIds[0] ?? null;
  const primaryGap = primary ? getGapType(primary) : null;

  const summary = primaryGap
    ? `Heard a pattern matching “${primaryGap.label}”.`
    : "Marks were noted, but they did not map cleanly to a named gap. You can pick one from the list.";

  return {
    gapTypeIds,
    primaryGapTypeId: primary,
    summary,
    analysisSource: source,
    evidenceNotes: notes,
  };
}

export function canDiagnose(subject: Subject, grade: Grade): boolean {
  return COMPETENCY_GAP_TYPES.some((g) => g.subject === subject && g.grades.includes(grade));
}
