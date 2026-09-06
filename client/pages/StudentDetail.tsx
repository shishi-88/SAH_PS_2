import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { getGapType } from "@/domain/competency-registry";
import { formatShortDate } from "@/domain/ids";
import { urgencyForGap } from "@/domain/class-overview";
import { useState } from "react";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { snapshot, ready, resolveGap, continueGap, removeStudent } = useApp();
  const [message, setMessage] = useState<string | null>(null);

  if (!ready) return null;
  const student = snapshot.students.find((s) => s.id === id);
  if (!student) {
    return (
      <p className="text-sm text-muted-foreground">
        Student not found. <Link to="/">Go home</Link>
      </p>
    );
  }

  const historyGaps = snapshot.gaps
    .filter((g) => g.studentId === student.id)
    .sort((a, b) => +new Date(b.lastDetectedAt) - +new Date(a.lastDetectedAt));
  const assessments = snapshot.assessments
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const sheets = snapshot.worksheets.filter((w) => w.studentId === student.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <StudentAvatar name={student.name} tint={student.avatarTint} size="lg" />
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">{student.name}</h1>
          <p className="text-sm text-muted-foreground">
            Grade {student.grade} · Roll {student.rollNo}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1 rounded-full" size="lg">
          <Link to={`/assess?student=${student.id}`}>Assess</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1 rounded-full" size="lg">
          <Link to={`/students/${student.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">Skill-gap history</h2>
        {historyGaps.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No gaps recorded yet.
          </p>
        ) : (
          historyGaps.map((g) => {
            const type = getGapType(g.gapTypeId);
            const due = new Date(g.reassessmentDueAt).getTime() <= Date.now() && g.status === "active";
            const drills = sheets.filter((w) => w.gapRecordId === g.id);
            return (
              <article key={g.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={g.status} urgency={urgencyForGap(g)} />
                  {due && (
                    <span className="text-xs font-semibold text-secondary">Reassess now</span>
                  )}
                </div>
                <h3 className="mt-2 font-heading text-base font-bold">{type?.label ?? g.gapTypeId}</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>First noticed {formatShortDate(g.firstDetectedAt)}</li>
                  <li>Last sample {formatShortDate(g.lastDetectedAt)}</li>
                  <li>
                    {drills.length} drill{drills.length === 1 ? "" : "s"} generated · currently tier {g.currentTier}
                  </li>
                  <li>
                    {g.status === "resolved"
                      ? `Closed on ${formatShortDate(g.resolvedAt!)}`
                      : `Still open · next listen by ${formatShortDate(g.reassessmentDueAt)}`}
                  </li>
                </ul>
                {g.status === "active" && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button asChild size="sm" className="rounded-full">
                      <Link to={`/assess?student=${student.id}&subject=${g.subject}&gap=${g.id}`}>
                        Reassess
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={async () => {
                        await resolveGap(g.id);
                        setMessage("Gap closed. This student can return to the usual rotation.");
                      }}
                    >
                      Mark resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={async () => {
                        const ws = await continueGap(g.id);
                        setMessage(
                          ws
                            ? "Still open — a slightly fuller drill was added."
                            : "Still open. No extra template was available for this tier.",
                        );
                        if (ws) navigate(`/worksheets/${ws.id}`);
                      }}
                    >
                      Still struggling · harder drill
                    </Button>
                  </div>
                )}
                {drills.map((d) => (
                  <Link
                    key={d.id}
                    to={`/worksheets/${d.id}`}
                    className="mt-2 block text-sm font-semibold text-primary"
                  >
                    Open “{d.title}”
                  </Link>
                ))}
              </article>
            );
          })
        )}
      </section>

      {message && <p className="text-sm text-primary">{message}</p>}

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-bold">Assessments</h2>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          assessments.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
              <p className="font-semibold">
                {a.subject === "reading" ? "Reading" : "Numeracy"} · {formatShortDate(a.timestamp)}
              </p>
              <p className="text-muted-foreground">{a.summary}</p>
            </div>
          ))
        )}
      </section>

      <Button
        variant="ghost"
        className="text-destructive"
        onClick={async () => {
          if (confirm(`Remove ${student.name} from this phone?`)) {
            await removeStudent(student.id);
            navigate("/");
          }
        }}
      >
        Remove student from this phone
      </Button>
    </div>
  );
}
