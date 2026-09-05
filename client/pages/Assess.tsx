import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Check,
  Mic,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StudentAvatar from "@/components/StudentAvatar";
import {
  students,
  gapTemplates,
  readingPrompts,
  numeracyPrompts,
  type SkillArea,
  type GapTemplate,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Step = "student" | "skill" | "prompt" | "recording" | "processing" | "result";

const RECORD_SECONDS = 30;

export default function Assess() {
  const [params] = useSearchParams();
  const preselected = params.get("student");

  const [studentId, setStudentId] = useState<string | null>(preselected);
  const [skill, setSkill] = useState<SkillArea | null>(null);
  const [step, setStep] = useState<Step>(preselected ? "skill" : "student");
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<GapTemplate | null>(null);
  const [worksheetOpen, setWorksheetOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const student = useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [studentId],
  );

  useEffect(() => {
    if (step !== "recording") return;
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= RECORD_SECONDS) {
          clearInterval(timerRef.current!);
          finishRecording();
          return RECORD_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function finishRecording() {
    setStep("processing");
    setTimeout(() => {
      const pool = gapTemplates.filter(
        (g) => g.skillArea === skill && g.grade === student?.grade,
      );
      const pick = pool[Math.floor(Math.random() * pool.length)] ?? gapTemplates[0];
      setResult(pick);
      setStep("result");
    }, 1600);
  }

  function reset() {
    setStudentId(null);
    setSkill(null);
    setResult(null);
    setStep("student");
  }

  const prompt =
    student && skill
      ? (skill === "reading" ? readingPrompts : numeracyPrompts)[student.grade]
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => {
            if (step === "student") return;
            if (step === "skill") setStep("student");
            else if (step === "prompt") setStep("skill");
            else if (step === "result") reset();
            else setStep("skill");
          }}
          asChild={step === "student"}
        >
          {step === "student" ? (
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </Button>
        <h1 className="font-heading text-xl font-bold text-foreground">
          {step === "student" && "Choose a student"}
          {step === "skill" && "Choose a skill area"}
          {(step === "prompt" || step === "recording") && "Assessment prompt"}
          {step === "processing" && "Listening carefully…"}
          {step === "result" && "Diagnosed gap"}
        </h1>
      </div>

      {step === "student" && (
        <div className="space-y-2.5">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStudentId(s.id);
                setStep("skill");
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-soft transition-colors hover:bg-accent"
            >
              <StudentAvatar student={s} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[15px] font-bold text-foreground">
                  {s.name}
                </p>
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
          <div className="flex items-center gap-3 rounded-2xl bg-accent p-4">
            <StudentAvatar student={student} />
            <div>
              <p className="font-heading text-base font-bold text-foreground">
                {student.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Grade {student.grade} · Roll {student.rollNo}
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            What would you like to assess today?
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => {
                setSkill("reading");
                setStep("prompt");
              }}
              className="flex flex-col items-start gap-3 rounded-3xl border border-border bg-card p-5 text-left shadow-soft transition-colors hover:bg-accent"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <BookOpen className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className="font-heading text-lg font-bold text-foreground">
                Reading
              </span>
              <span className="text-sm text-muted-foreground">
                A short passage read aloud
              </span>
            </button>
            <button
              onClick={() => {
                setSkill("numeracy");
                setStep("prompt");
              }}
              className="flex flex-col items-start gap-3 rounded-3xl border border-border bg-card p-5 text-left shadow-soft transition-colors hover:bg-accent"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 text-secondary">
                <Calculator className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className="font-heading text-lg font-bold text-foreground">
                Numeracy
              </span>
              <span className="text-sm text-muted-foreground">
                A number sequence spoken aloud
              </span>
            </button>
          </div>
        </div>
      )}

      {(step === "prompt" || step === "recording") && student && prompt && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {skill === "reading" ? "Reading passage" : "Number sequence"} ·
              Grade {student.grade}
            </p>
            <p className="mt-2 font-heading text-lg font-bold text-foreground">
              {prompt.title}
            </p>
            <p className="mt-3 text-[17px] leading-loose text-foreground">
              {prompt.text}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-3xl bg-accent px-5 py-8 text-center">
            {step === "prompt" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Hand the phone to {student.name.split(" ")[0]} and press
                  record when ready.
                </p>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full p-0 shadow-card"
                  onClick={() => setStep("recording")}
                >
                  <Mic className="h-7 w-7" strokeWidth={2.2} />
                </Button>
              </>
            )}
            {step === "recording" && (
              <>
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 animate-pulse-soft rounded-full bg-secondary/30" />
                  <Button
                    size="lg"
                    variant="secondary"
                    className="relative h-16 w-16 rounded-full p-0 shadow-card"
                    onClick={() => {
                      if (timerRef.current) clearInterval(timerRef.current);
                      finishRecording();
                    }}
                  >
                    <Square className="h-6 w-6" strokeWidth={2.2} />
                  </Button>
                </div>
                <p className="font-heading text-lg font-bold text-foreground">
                  Recording… 0:{String(seconds).padStart(2, "0")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tap the square to stop early
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-accent px-5 py-16 text-center">
          <span className="flex h-14 w-14 animate-pulse-soft items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-7 w-7" strokeWidth={2} />
          </span>
          <p className="font-heading text-lg font-bold text-foreground">
            Comparing the response to the expected {skill === "reading" ? "passage" : "sequence"}…
          </p>
          <p className="text-sm text-muted-foreground">
            Everything happens on this phone, nothing leaves the device.
          </p>
        </div>
      )}

      {step === "result" && student && result && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <StudentAvatar student={student} />
              <div>
                <p className="font-heading text-base font-bold text-foreground">
                  {student.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Grade {student.grade} · {skill === "reading" ? "Reading" : "Numeracy"}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-status-attention/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-status-attention-foreground">
                Specific gap identified
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {result.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {result.description}
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Saved to {student.name.split(" ")[0]}'s record just now.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1 rounded-full"
              size="lg"
              onClick={() => setWorksheetOpen(true)}
            >
              Generate practice sheet
            </Button>
            <Button
              variant="secondary"
              className="flex-1 rounded-full"
              size="lg"
              onClick={reset}
            >
              Assess another student
            </Button>
          </div>
        </div>
      )}

      <Dialog open={worksheetOpen} onOpenChange={setWorksheetOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {result?.worksheetTitle}
            </DialogTitle>
            <DialogDescription>
              Individualised for {student?.name} · {result?.worksheetFocus}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-2xl bg-accent p-4 text-sm text-foreground">
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" /> Matched to
              this exact gap, not a generic grade sheet
            </p>
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" /> Linked to{" "}
              {student?.name.split(" ")[0]}'s record for reassessment later
            </p>
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" /> Ready to
              preview, print, or display on screen
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 rounded-full">
              Preview sheet
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={() => setWorksheetOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
