import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRightLeft,
  Blocks,
  BookOpen,
  Calculator,
  Clock,
  Dices,
  GitCompare,
  Hash,
  Layers,
  ListChecks,
  ListOrdered,
  MessageCircle,
  Mic,
  Minus,
  Plus,
  Puzzle,
  Repeat,
  Ruler,
  Split,
  Square,
  Type,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import TokenMarker from "@/components/TokenMarker";
import WorksheetPreview from "@/components/WorksheetPreview";
import { useApp } from "@/state/AppProvider";
import { categoriesFor, getCategory } from "@/domain/assessment-categories";
import { gapTypesFor, getGapType } from "@/domain/competency-registry";
import { diagnose, matchTranscriptToObservations } from "@/domain/diagnosis";
import { promptsFor } from "@/domain/prompts";
import { buildAssessSessionOrder } from "@/domain/assessment-session";
import type {
  AnalysisSource,
  AssessmentPrompt,
  Subject,
  TokenObservation,
} from "@/domain/types";
import {
  inspectSpeechCapability,
  startAudioRecording,
  startOptionalWebSpeech,
} from "@/speech/capabilities";
import { localizedGapType, localizedPrompt, t } from "@/lib/i18n";
import type { AssessmentCategory } from "@/domain/assessment-categories";

type Step = "student" | "skill" | "category" | "prompt" | "listen" | "mark" | "result";

const CATEGORY_ICONS: Record<AssessmentCategory["icon"], typeof BookOpen> = {
  letters: Type,
  sound: Volume2,
  cvc: Blocks,
  blend: GitCompare,
  word: BookOpen,
  sentence: MessageCircle,
  passage: Layers,
  fluency: Clock,
  number: Hash,
  counting: ListOrdered,
  sequence: ListChecks,
  beforeafter: ArrowRightLeft,
  compare: ArrowDownUp,
  tens: Split,
  place: Ruler,
  add: Plus,
  sub: Minus,
  bond: Puzzle,
  skip: Repeat,
  problem: Calculator,
};

export default function Assess() {
  const { snapshot, ready, recordAssessment, language } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preselected = params.get("student");
  const presetSubject = params.get("subject") as Subject | null;
  const presetGrade = Number(params.get("grade")) || null;
  const relatedGapId = params.get("gap") || undefined;

  const [studentId, setStudentId] = useState<string | null>(preselected);
  const [subject, setSubject] = useState<Subject | null>(
    presetSubject === "reading" || presetSubject === "numeracy" ? presetSubject : null,
  );
  const [category, setCategory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<AssessmentPrompt | null>(null);
  const [step, setStep] = useState<Step>(
    preselected ? (presetSubject ? "category" : "skill") : "student",
  );
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [observations, setObservations] = useState<TokenObservation[]>([]);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [chosenGap, setChosenGap] = useState<string | null>(null);
  const [suggestedGapIds, setSuggestedGapIds] = useState<string[]>([]);
  const [diagnosisSummary, setDiagnosisSummary] = useState("");
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>("teacher-assisted");
  const [saved, setSaved] = useState<{
    gapId?: string;
    worksheetId?: string;
    gapTypeId?: string;
  } | null>(null);
  const [savedSheet, setSavedSheet] = useState<import("@/domain/types").WorksheetInstance | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const speechNote = useMemo(() => inspectSpeechCapability(language), [language]);
  const recRef = useRef<Awaited<ReturnType<typeof startAudioRecording>>>(null);
  const dictationRef = useRef<ReturnType<typeof startOptionalWebSpeech>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const student = useMemo(
    () => snapshot.students.find((s) => s.id === studentId) ?? null,
    [snapshot.students, studentId],
  );

  /* One randomized session order per visit: classes stay grouped
     (Class 1 → 2 → 3) and students are shuffled once inside each class.
     The state initializer runs only when this assessment session starts,
     so rerenders and navigation never reshuffle the list. */
  const [sessionOrder, setSessionOrder] = useState(() =>
    buildAssessSessionOrder(snapshot.students),
  );

  const studentGroups = useMemo(() => {
    if (!presetGrade) return sessionOrder.groups;
    return sessionOrder.groups.filter((g) => g.grade === presetGrade);
  }, [sessionOrder.groups, presetGrade]);

  const studentList = useMemo(
    () => studentGroups.flatMap((g) => g.students),
    [studentGroups],
  );

  /* Auto-advance when a category has exactly one prompt. */
  useEffect(() => {
    if (student && subject && category && !prompt) {
      const list = promptsFor(subject, student.grade, category);
      if (list.length === 1) {
        setPrompt(list[0]);
        setObservations([]);
        setStep("listen");
      }
    }
  }, [student, subject, category, prompt]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      dictationRef.current?.stop();
    };
  }, []);

  async function beginRecord() {
    setSeconds(0);
    setRecording(true);
    try {
      recRef.current = await startAudioRecording();
    } catch {
      recRef.current = null;
    }
    if (speechNote.hasWebSpeechRecognition) {
      dictationRef.current = startOptionalWebSpeech((t) => setTranscript(t));
    }
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function stopRecord() {
    if (timerRef.current) clearInterval(timerRef.current);
    dictationRef.current?.stop();
    dictationRef.current = null;
    if (recRef.current) {
      await recRef.current.stop();
      recRef.current = null;
    }
    setRecording(false);
    if (prompt && transcript.trim()) {
      const auto = matchTranscriptToObservations(localizedPrompt(prompt, language), transcript);
      if (auto.observations.length) {
        setObservations(auto.observations);
        setAnalysisSource("web-speech-assist");
      }
    }
    setStep("mark");
  }

  function runDiagnosis() {
    if (!prompt) return;
    const result = diagnose(
      localizedPrompt(prompt, language),
      {
        observations,
        transcript: transcript || undefined,
        notes,
        recordingSeconds: seconds || undefined,
      },
      {
        transcriptFromWebSpeech: analysisSource === "web-speech-assist",
        lang: language,
      },
    );
    setDiagnosisSummary(result.summary);
    setAnalysisSource(result.analysisSource);
    setSuggestedGapIds(result.gapTypeIds);
    const preferred = relatedGapId
      ? snapshot.gaps.find((g) => g.id === relatedGapId)?.gapTypeId
      : undefined;
    setChosenGap(preferred && result.gapTypeIds.includes(preferred) ? preferred : result.primaryGapTypeId);
    setStep("result");
  }

  async function persist(resolveInstead?: boolean) {
    if (!student || !subject || !prompt) return;
    setSaving(true);
    try {
      if (resolveInstead && relatedGapId) {
        /* handled on student page; keep assess save as open gap */
      }
      const { gap, worksheet } = await recordAssessment({
        studentId: student.id,
        gapTypeId: chosenGap,
        relatedGapId,
        assessment: {
          studentId: student.id,
          subject,
          grade: student.grade,
          promptId: prompt.id,
          timestamp: new Date().toISOString(),
          kind: relatedGapId ? "reassessment" : "initial",
          relatedGapId,
          evidence: {
            observations,
            transcript: transcript || undefined,
            notes: notes || undefined,
            recordingSeconds: seconds || undefined,
          },
          detectedGapTypeIds: chosenGap ? [chosenGap] : [],
          analysisSource,
          summary: diagnosisSummary,
        },
      });
      setSaved({ gapId: gap?.id, worksheetId: worksheet?.id, gapTypeId: gap?.gapTypeId });
      setSavedSheet(worksheet);
    } finally {
      setSaving(false);
    }
  }

  const sheet =
    savedSheet ??
    (saved?.worksheetId ? snapshot.worksheets.find((w) => w.id === saved.worksheetId) : undefined);
  const gapTypeIdForSheet = saved?.gapTypeId;

  if (!ready) return <p className="py-16 text-center text-muted-foreground">{t(language, "assess.loading")}</p>;

  const title =
    step === "student"
      ? t(language, "assess.chooseStudent")
      : step === "skill"
        ? t(language, "assess.skill")
        : step === "category"
          ? t(language, "assess.category")
          : step === "prompt"
            ? t(language, "assess.choosePrompt")
            : step === "listen"
              ? t(language, "assess.listen")
              : step === "mark"
                ? t(language, "assess.whatHeard")
                : t(language, "assess.gapTitle");

  const backTo = (() => {
    if (step === "student") return "/";
    if (step === "skill") return "student";
    if (step === "category") return "skill";
    if (step === "prompt") return "category";
    if (step === "listen") {
      const many = student && subject && category
        ? promptsFor(subject, student.grade, category).length > 1
        : false;
      return many ? "prompt" : "category";
    }
    if (step === "mark") return "listen";
    return saved ? "/" : "mark";
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => {
            if (backTo === "/") navigate("/");
            else setStep(backTo as Step);
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-xl font-bold">{title}</h1>
      </div>

      {step === "student" && (
        <div className="space-y-5">
          {studentList.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-muted-foreground">
                {t(language, "assess.classRandomized")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-full text-xs"
                onClick={() => setSessionOrder(buildAssessSessionOrder(snapshot.students))}
              >
                <Dices className="h-4 w-4" />
                {t(language, "assess.newOrder")}
              </Button>
            </div>
          )}
          {studentList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {presetGrade
                ? t(language, "assess.noStudentsGrade", { grade: presetGrade })
                : t(language, "assess.addFirst")}{" "}
              <Link className="font-semibold text-primary" to={`/students/new${presetGrade ? `?grade=${presetGrade}` : ""}`}>
                {t(language, "assess.createProfile")}
              </Link>
            </p>
          )}
          {studentGroups.map((group) => (
            <section key={group.grade} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1 pt-1">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {t(language, "class.grade", { grade: group.grade })}
                </h2>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {t(language, "assess.classStudents", {
                    n: group.students.length,
                    s: group.students.length === 1 ? "" : "s",
                  })}
                </span>
              </div>
              {group.students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStudentId(s.id);
                    setPrompt(null);
                    setCategory(null);
                    setStep("skill");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-soft"
                >
                  <StudentAvatar name={s.name} tint={s.avatarTint} />
                  <div>
                    <p className="font-heading font-bold">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Grade {s.grade} · Roll {s.rollNo}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          ))}
        </div>
      )}

      {step === "skill" && student && (
        <div className="space-y-5">
          <StudentChip name={student.name} tint={student.avatarTint} grade={student.grade} roll={student.rollNo} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SubjectCard
              icon={BookOpen}
              title={t(language, "assess.reading")}
              detail={t(language, "assess.readingDetail")}
              onClick={() => {
                setSubject("reading");
                setCategory(null);
                setPrompt(null);
                setStep("category");
              }}
            />
            <SubjectCard
              icon={Calculator}
              title={t(language, "assess.numeracy")}
              detail={t(language, "assess.numeracyDetail")}
              coral
              onClick={() => {
                setSubject("numeracy");
                setCategory(null);
                setPrompt(null);
                setStep("category");
              }}
            />
          </div>
        </div>
      )}

      {step === "category" && student && subject && (
        <div className="space-y-5">
          <StudentChip name={student.name} tint={student.avatarTint} grade={student.grade} roll={student.rollNo} />
          <div className="grid gap-3 sm:grid-cols-2">
            {categoriesFor(subject, student.grade).map((c) => {
              const Icon = CATEGORY_ICONS[c.icon];
              const reading = c.subject === "reading";
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id);
                    setPrompt(null);
                    setStep("prompt");
                  }}
                  className="flex flex-col items-start gap-2.5 rounded-3xl border border-border bg-card p-4 text-left shadow-soft"
                >
                  <span
                    className={
                      reading
                        ? "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"
                        : "flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/12 text-secondary"
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-heading text-[15px] font-bold leading-snug">{c.label}</span>
                  <span className="text-sm leading-snug text-muted-foreground">{c.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "prompt" && student && subject && category && (
        <div className="space-y-3">
          {getCategory(category) && (
            <p className="px-1 text-sm text-muted-foreground">
              {getCategory(category)!.label} ·{" "}
              {t(language, "assess.gradeLabel", { grade: student.grade })}
            </p>
          )}
          {promptsFor(subject, student.grade, category).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPrompt(p);
                setObservations([]);
                setStep("listen");
              }}
              className="w-full rounded-3xl border border-border bg-card p-5 text-left shadow-soft"
            >
              <p className="font-heading text-lg font-bold">{p.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.displayText}</p>
            </button>
          ))}
        </div>
      )}

      {step === "listen" && student && prompt && (() => {
        const view = localizedPrompt(prompt, language);
        return (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {getCategory(prompt.category)?.label ?? (view.subject === "reading" ? t(language, "assess.readingPassage") : t(language, "assess.numberSequence"))} · {t(language, "assess.gradeLabel", { grade: student.grade })}
            </p>
            <p className="mt-2 font-heading text-lg font-bold">{view.title}</p>
            <p className="mt-3 text-[17px] leading-loose">{view.displayText}</p>
            <p className="mt-3 text-sm text-muted-foreground">{view.instruction}</p>
          </div>
          <div className="rounded-3xl bg-accent px-5 py-8 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">{speechNote.note}</p>
            <div className="mt-4 flex flex-col items-center gap-3">
              {!recording ? (
                <Button size="lg" className="h-16 w-16 rounded-full p-0 shadow-card" onClick={beginRecord}>
                  <Mic className="h-7 w-7" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-16 w-16 rounded-full p-0 shadow-card"
                  onClick={stopRecord}
                >
                  <Square className="h-6 w-6" />
                </Button>
              )}
              <p className="font-heading font-bold">
                {recording
                  ? t(language, "assess.listening", { time: `0:${String(Math.min(seconds, 99)).padStart(2, "0")}` })
                  : t(language, "assess.startListening")}
              </p>
              <Button variant="ghost" className="rounded-full" onClick={() => setStep("mark")}>
                {t(language, "assess.skipRecord")}
              </Button>
            </div>
            {transcript ? (
              <p className="mt-3 text-left text-sm">
                <span className="font-semibold">{t(language, "assess.dictation")}</span>
                {transcript}
              </p>
            ) : null}
          </div>
        </div>
        );
      })()}

      {step === "mark" && prompt && (
        <div className="space-y-5">
          <TokenMarker prompt={localizedPrompt(prompt, language)} observations={observations} onChange={setObservations} />
          <label className="block text-sm font-semibold">
            {t(language, "assess.extraNotes")}
            <textarea
              className="mt-1 min-h-20 w-full rounded-2xl border border-border bg-card px-3 py-2 text-base font-normal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(language, "assess.notesPlaceholder")}
            />
          </label>
          <Button className="w-full rounded-full" size="lg" onClick={runDiagnosis}>
            {t(language, "assess.findGap")}
          </Button>
        </div>
      )}

      {step === "result" && student && subject && (
        <div className="space-y-5">
          <StudentChip name={student.name} tint={student.avatarTint} grade={student.grade} roll={student.rollNo} />
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm leading-relaxed text-muted-foreground">{diagnosisSummary}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t(language, analysisSource === "web-speech-assist" ? "assess.sourceDictation" : "assess.sourceTeacher")}
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">{t(language, "assess.namedGap")}</p>
              <GapRadios
                gapTypeIds={gapTypesFor(subject, student.grade)
                  .filter((g) => suggestedGapIds.includes(g.id))
                  .map((g) => g.id)}
                suggested
                chosenGap={chosenGap}
                onChange={setChosenGap}
                language={language}
              />
              {(() => {
                const others = gapTypesFor(subject, student.grade).filter(
                  (g) => !suggestedGapIds.includes(g.id),
                );
                if (others.length === 0) return null;
                return (
                  <details className="rounded-2xl border border-dashed border-border px-3 py-2.5">
                    <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
                      {t(language, "assess.otherGaps")}
                    </summary>
                    <div className="mt-2 space-y-2">
                      <GapRadios
                        gapTypeIds={others.map((g) => g.id)}
                        chosenGap={chosenGap}
                        onChange={setChosenGap}
                        language={language}
                      />
                    </div>
                  </details>
                );
              })()}
              <label className="flex items-start gap-3 rounded-2xl border border-dashed border-border px-3 py-3">
                <input
                  type="radio"
                  name="gap"
                  checked={chosenGap === null}
                  onChange={() => setChosenGap(null)}
                  className="mt-1"
                />
                <span className="text-sm">{t(language, "assess.noGapOption")}</span>
              </label>
            </div>
          </div>

          {!saved ? (
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={() => persist()}>
              {saving
                ? t(language, "assess.saving")
                : chosenGap
                  ? t(language, "assess.saveGap")
                  : t(language, "assess.saveSample")}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t(language, "assess.savedTo", { first: student.name.split(" ")[0] })}
                {chosenGap
                  ? ` · ${localizedGapType(getGapType(chosenGap)!, language).label}`
                  : ""}
                .
              </p>
              {sheet && (
                <>
                  <WorksheetPreview sheet={sheet} student={student} gapTypeId={gapTypeIdForSheet} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1 rounded-full" size="lg">
                      <Link to={`/worksheets/${sheet.id}`}>{t(language, "assess.previewPrint")}</Link>
                    </Button>
                    <Button asChild variant="secondary" className="flex-1 rounded-full" size="lg">
                      <Link to={`/students/${student.id}`}>{t(language, "assess.studentHistory")}</Link>
                    </Button>
                  </div>
                </>
              )}
              <Button variant="ghost" className="w-full rounded-full" onClick={() => navigate("/")}>
                {t(language, "assess.backToClass")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GapRadios({
  gapTypeIds,
  chosenGap,
  onChange,
  language,
  suggested,
}: {
  gapTypeIds: string[];
  chosenGap: string | null;
  onChange: (id: string | null) => void;
  language: import("@/lib/i18n").Language;
  suggested?: boolean;
}) {
  return (
    <>
      {gapTypeIds.map((id) => {
        const g = getGapType(id);
        if (!g) return null;
        const view = localizedGapType(g, language);
        return (
          <label
            key={id}
            className="flex items-start gap-3 rounded-2xl border border-border bg-accent/60 px-3 py-3"
          >
            <input
              type="radio"
              name="gap"
              checked={chosenGap === id}
              onChange={() => onChange(id)}
              className="mt-1"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="block font-heading font-bold">{view.label}</span>
                {suggested && (
                  <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Suggested
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">{view.description}</span>
            </span>
          </label>
        );
      })}
    </>
  );
}

function StudentChip({
  name,
  tint,
  grade,
  roll,
}: {
  name: string;
  tint: "teal" | "coral" | "yellow" | "lilac";
  grade: number;
  roll: string;
}) {
  const { language } = useApp();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-accent p-4">
      <StudentAvatar name={name} tint={tint} />
      <div>
        <p className="font-heading font-bold">{name}</p>
        <p className="text-sm text-muted-foreground">
          {t(language, "home.gradeRoll", { grade, roll })}
        </p>
      </div>
    </div>
  );
}

function SubjectCard({
  icon: Icon,
  title,
  detail,
  onClick,
  coral,
}: {
  icon: typeof BookOpen;
  title: string;
  detail: string;
  onClick: () => void;
  coral?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-3xl border border-border bg-card p-5 text-left shadow-soft"
    >
      <span
        className={
          coral
            ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 text-secondary"
            : "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        }
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="font-heading text-lg font-bold">{title}</span>
      <span className="text-sm text-muted-foreground">{detail}</span>
    </button>
  );
}