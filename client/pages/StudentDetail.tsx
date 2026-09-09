import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { getGapType } from "@/domain/competency-registry";
import { formatShortDate } from "@/domain/ids";
import { urgencyForGap } from "@/domain/class-overview";
import { localizedGapType, t } from "@/lib/i18n";
import { useState } from "react";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { snapshot, ready, resolveGap, continueGap, removeStudent, language } = useApp();
  const [message, setMessage] = useState<string | null>(null);

  if (!ready) return null;
  const student = snapshot.students.find((s) => s.id === id);
  if (!student) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(language, "sd.notFound")} <Link to="/">{t(language, "sd.goHome")}</Link>
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
            {t(language, "home.gradeRoll", { grade: student.grade, roll: student.rollNo })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1 rounded-full" size="lg">
          <Link to={`/assess?student=${student.id}`}>{t(language, "sd.assess")}</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1 rounded-full" size="lg">
          <Link to={`/students/${student.id}/edit`}>{t(language, "sd.edit")}</Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">{t(language, "sd.history")}</h2>
        {historyGaps.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            {t(language, "sd.noGaps")}
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
                  {g.status === "active" && g.lastOutcome === "improving" && (
                    <span className="rounded-full bg-status-ontrack/15 px-2.5 py-1 text-xs font-semibold text-status-ontrack-foreground">
                      {t(language, "sd.improving")}
                    </span>
                  )}
                  {g.status === "active" && g.lastOutcome === "still-present" && (
                    <span className="rounded-full bg-status-attention/20 px-2.5 py-1 text-xs font-semibold text-status-attention-foreground">
                      {t(language, "sd.stillPresent")}
                    </span>
                  )}
                  {due && (
                    <span className="text-xs font-semibold text-secondary">{t(language, "sd.reassessNow")}</span>
                  )}
                </div>
                <h3 className="mt-2 font-heading text-base font-bold">
                  {type ? localizedGapType(type, language).label : g.gapTypeId}
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>{t(language, "sd.firstNoticed", { date: formatShortDate(g.firstDetectedAt) })}</li>
                  <li>{t(language, "sd.lastSample", { date: formatShortDate(g.lastDetectedAt) })}</li>
                  <li>
                    {t(language, "sd.drills", {
                      n: drills.length,
                      s: drills.length === 1 ? "" : "s",
                      tier: g.currentTier,
                    })}
                  </li>
                  <li>
                    {g.status === "resolved"
                      ? t(language, "sd.closed", { date: formatShortDate(g.resolvedAt!) })
                      : t(language, "sd.stillOpen", { date: formatShortDate(g.reassessmentDueAt) })}
                  </li>
                </ul>
                {g.status === "active" && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button asChild size="sm" className="rounded-full">
                      <Link to={`/assess?student=${student.id}&subject=${g.subject}&gap=${g.id}`}>
                        {t(language, "sd.reassess")}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={async () => {
                        await resolveGap(g.id);
                        setMessage(t(language, "sd.gapClosed"));
                      }}
                    >
                      {t(language, "sd.markResolved")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={async () => {
                        const ws = await continueGap(g.id);
                        setMessage(
                          ws ? t(language, "sd.extraDrill") : t(language, "sd.noTemplate"),
                        );
                        if (ws) navigate(`/worksheets/${ws.id}`);
                      }}
                    >
                      {t(language, "sd.harderDrill")}
                    </Button>
                  </div>
                )}
                {drills.map((d) => (
                  <Link
                    key={d.id}
                    to={`/worksheets/${d.id}`}
                    className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    <span className="min-w-0 truncate">{t(language, "sd.openSheet", { title: d.title })}</span>
                    {d.status === "practiced" && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ontrack-foreground" />
                    )}
                  </Link>
                ))}
              </article>
            );
          })
        )}
      </section>

      {message && <p className="text-sm text-primary">{message}</p>}

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-bold">{t(language, "sd.assessments")}</h2>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(language, "sd.noneYet")}</p>
        ) : (
          assessments.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
              <p className="font-semibold">
                {t(
                  language,
                  a.subject === "reading" ? "assess.reading" : "assess.numeracy",
                )}{" "}
                · {formatShortDate(a.timestamp)}
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
          if (confirm(t(language, "sd.confirmRemove", { name: student.name }))) {
            await removeStudent(student.id);
            navigate("/");
          }
        }}
      >
        {t(language, "sd.remove")}
      </Button>
    </div>
  );
}
