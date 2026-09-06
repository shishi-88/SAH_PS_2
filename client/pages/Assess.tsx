import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Calculator, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import TokenMarker from "@/components/TokenMarker";
import WorksheetPreview from "@/components/WorksheetPreview";
import { useApp } from "@/state/AppProvider";
import { gapTypesFor, getGapType } from "@/domain/competency-registry";
import { diagnose, matchTranscriptToObservations } from "@/domain/diagnosis";
import { promptsFor } from "@/domain/prompts";
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

type Step = "student" | "skill" | "prompt" | "listen" | "mark" | "result";

export default function Assess() {
  const { snapshot, ready, recordAssessment } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preselected = params.get("student");
  const presetSubject = params.get("subject") as Subject | null;
  const relatedGapId = params.get("gap") || undefined;

  const [studentId, setStudentId] = useState<string | null>(preselected);
  const [subject, setSubject] = useState<Subject | null>(
    presetSubject === "reading" || presetSubject === "numeracy" ? presetSubject : null,
  );
  const [prompt, setPrompt] = useState<AssessmentPrompt | null>(null);
  const [step, setStep] = useState<Step>(preselected ? (presetSubject ? "prompt" : "skill") : "student");
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [observations, setObservations] = useState<TokenObservation[]>([]);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [chosenGap, setChosenGap] = useState<string | null>(null);
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
  const [speechNote] = useState(() => inspectSpeechCapability());
  const recRef = useRef<Awaited<ReturnType<typeof startAudioRecording>>>(null);
  const dictationRef = useRef<ReturnType<typeof startOptionalWebSpeech>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const student = useMemo(
    () => snapshot.students.find((s) => s.id === studentId) ?? null,
    [snapshot.students, studentId],
  );

  useEffect(() => {
    if (student && subject && !prompt) {
      const list = promptsFor(subject, student.grade);
      if (list.length === 1) setPrompt(list[0]);
    }
  }, [student, subject, prompt]);

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
      const auto = matchTranscriptToObservations(prompt, transcript);
      if (auto.observations.length) {
        setObservations(auto.observations);
        setAnalysisSource("web-speech-assist");
      }
    }
    setStep("mark");
  }

  function runDiagnosis() {
    if (!prompt) return;
    const result = diagnose(prompt, {
      observations,
      transcript: transcript || undefined,
      notes,
      recordingSeconds: seconds || undefined,
    }, { transcriptFromWebSpeech: analysisSource === "web-speech-assist" });
    setDiagnosisSummary(result.summary);
    setAnalysisSource(result.analysisSource);
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

  if (!ready) return <p className="py-16 text-center text-muted-foreground">Loading…</p>;

  const title =
    step === "student"
      ? "Choose a student"
      : step === "skill"
        ? "Reading or numeracy?"
        : step === "prompt"
          ? "Choose a prompt"
          : step === "listen"
            ? "Listen"
            : step === "mark"
              ? "What did you hear?"
              : "Skill gap";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => {
            if (step === "student") navigate("/");
            else if (step === "skill") setStep("student");
            else if (step === "prompt") setStep("skill");
            else if (step === "listen") setStep(promptsFor(subject!, student!.grade).length > 1 ? "prompt" : "skill");
            else if (step === "mark") setStep("listen");
            else if (saved) navigate("/");
            else setStep("mark");
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-xl font-bold">{title}</h1>
      </div>

      {step === "student" && (
        <div className="space-y-2.5">
          {snapshot.students.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add a student first.{" "}
              <Link className="font-semibold text-primary" to="/students/new">
                Create profile
              </Link>
            </p>
          )}
          {snapshot.students.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStudentId(s.id);
                setPrompt(null);
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
        </div>
      )}

      {step === "skill" && student && (
        <div className="space-y-5">
          <StudentChip name={student.name} tint={student.avatarTint} grade={student.grade} roll={student.rollNo} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SubjectCard
              icon={BookOpen}
              title="Reading"
              detail="A short passage read aloud"
              onClick={() => {
                setSubject("reading");
                setPrompt(null);
                setStep("prompt");
              }}
            />
            <SubjectCard
              icon={Calculator}
              title="Numeracy"
              detail="A number sequence or place-value read-aloud"
              coral
              onClick={() => {
                setSubject("numeracy");
                setPrompt(null);
                setStep("prompt");
              }}
            />
          </div>
        </div>
      )}

      {step === "prompt" && student && subject && (
        <div className="space-y-3">
          {promptsFor(subject, student.grade).map((p) => (
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

      {step === "listen" && student && prompt && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {prompt.subject === "reading" ? "Reading passage" : "Number sequence"} · Grade {student.grade}
            </p>
            <p className="mt-2 font-heading text-lg font-bold">{prompt.title}</p>
            <p className="mt-3 text-[17px] leading-loose">{prompt.displayText}</p>
            <p className="mt-3 text-sm text-muted-foreground">{prompt.instruction}</p>
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
                {recording ? `Listening… 0:${String(Math.min(seconds, 99)).padStart(2, "0")}` : "Start listening"}
              </p>
              <Button variant="ghost" className="rounded-full" onClick={() => setStep("mark")}>
                Skip recording — mark by hand
              </Button>
            </div>
            {transcript ? (
              <p className="mt-3 text-left text-sm">
                <span className="font-semibold">Optional dictation (may need internet): </span>
                {transcript}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {step === "mark" && prompt && (
        <div className="space-y-5">
          <TokenMarker prompt={prompt} observations={observations} onChange={setObservations} />
          <label className="block text-sm font-semibold">
            Extra notes
            <textarea
              className="mt-1 min-h-20 w-full rounded-2xl border border-border bg-card px-3 py-2 text-base font-normal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you noticed…"
            />
          </label>
          <Button className="w-full rounded-full" size="lg" onClick={runDiagnosis}>
            Find the skill gap
          </Button>
        </div>
      )}

      {step === "result" && student && subject && (
        <div className="space-y-5">
          <StudentChip name={student.name} tint={student.avatarTint} grade={student.grade} roll={student.rollNo} />
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm leading-relaxed text-muted-foreground">{diagnosisSummary}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Source: {analysisSource === "web-speech-assist" ? "optional dictation + rules" : "teacher marks + rules"}.
              Mappings marked demo until verified NIPUN codes are inserted.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Named gap</p>
              {gapTypesFor(subject, student.grade).map((g) => (
                <label
                  key={g.id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-accent/60 px-3 py-3"
                >
                  <input
                    type="radio"
                    name="gap"
                    checked={chosenGap === g.id}
                    onChange={() => setChosenGap(g.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-heading font-bold">{g.label}</span>
                    <span className="text-sm text-muted-foreground">{g.description}</span>
                  </span>
                </label>
              ))}
              <label className="flex items-start gap-3 rounded-2xl border border-dashed border-border px-3 py-3">
                <input
                  type="radio"
                  name="gap"
                  checked={chosenGap === null}
                  onChange={() => setChosenGap(null)}
                  className="mt-1"
                />
                <span className="text-sm">No specific gap this time — save a clear sample only.</span>
              </label>
            </div>
          </div>

          {!saved ? (
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={() => persist()}>
              {saving ? "Saving on this phone…" : chosenGap ? "Save gap and make practice sheet" : "Save sample"}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Saved to {student.name.split(" ")[0]}’s record
                {getGapType(chosenGap ?? "") ? ` · ${getGapType(chosenGap!)!.label}` : ""}.
              </p>
              {sheet && (
                <>
                  <WorksheetPreview sheet={sheet} student={student} gapTypeId={gapTypeIdForSheet} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1 rounded-full" size="lg">
                      <Link to={`/worksheets/${sheet.id}`}>Preview / print</Link>
                    </Button>
                    <Button asChild variant="secondary" className="flex-1 rounded-full" size="lg">
                      <Link to={`/students/${student.id}`}>Student history</Link>
                    </Button>
                  </div>
                </>
              )}
              <Button variant="ghost" className="w-full rounded-full" onClick={() => navigate("/")}>
                Back to class
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentChip({
  name,
  tint,
  grade,
  roll,
}: {
  name: string;
  tint: "teal" | "coral" | "sand" | "sage";
  grade: number;
  roll: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-accent p-4">
      <StudentAvatar name={name} tint={tint} />
      <div>
        <p className="font-heading font-bold">{name}</p>
        <p className="text-sm text-muted-foreground">
          Grade {grade} · Roll {roll}
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
