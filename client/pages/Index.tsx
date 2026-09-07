import { Link } from "react-router-dom";
import { CalendarCheck2, Mic, Plus, Users2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { rotationView } from "@/domain/rotation";
import { buildGapGroups, suggestSmallGroups, urgencyForGap } from "@/domain/class-overview";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";

export default function Index() {
  const { ready, error, snapshot, language } = useApp();
  if (!ready) return <p className="py-16 text-center text-muted-foreground">{t(language, "home.opening")}</p>;
  if (error) return <p className="py-16 text-center text-destructive">{error}</p>;

  const { classroom, students, gaps } = snapshot;
  const rotation = rotationView(classroom, students);
  const groups = buildGapGroups(gaps);
  const suggested = suggestSmallGroups(groups, 3, language);
  const due = gaps.filter(
    (g) => g.status === "active" && new Date(g.reassessmentDueAt).getTime() <= Date.now(),
  );

  const roster = [...students].sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));

  return (
    <div className="space-y-7">
      <section className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{classroom.teacherLabel}</p>
        <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground sm:text-3xl">
          {classroom.name}
        </h1>
      </section>

      <Link
        to="/assess"
        className="group flex items-center gap-4 rounded-3xl bg-primary px-5 py-5 text-primary-foreground shadow-card"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <Mic className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <span className="flex-1">
          <span className="block font-heading text-lg font-bold">{t(language, "home.assessCta")}</span>
          <span className="block text-sm text-primary-foreground/85">
            {t(language, "home.assessSub")}
          </span>
        </span>
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <CalendarCheck2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-heading text-base font-bold text-foreground">{t(language, "home.rotation")}</p>
              <p className="text-sm text-muted-foreground">
                {t(language, "home.heard", { done: rotation.assessedCount, total: rotation.total })}
              </p>
            </div>
          </div>
          <span className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary">
            {rotation.percent}%
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${rotation.percent}%` }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {rotation.remaining === 0
            ? t(language, "home.rotationDone")
            : t(language, "home.aboutRotation", {
                perDay: rotation.studentsPerDay,
                days: rotation.schoolDaysLeft,
                s: rotation.schoolDaysLeft === 1 ? "" : "s",
              })}
        </p>
      </section>

      {due.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-secondary" strokeWidth={2.2} />
            <h2 className="font-heading text-lg font-bold">{t(language, "home.due")}</h2>
          </div>
          {due.map((g) => {
            const student = students.find((s) => s.id === g.studentId);
            const type = getGapType(g.gapTypeId);
            if (!student || !type) return null;
            return (
              <Link
                key={g.id}
                to={`/assess?student=${student.id}&subject=${g.subject}&gap=${g.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <StudentAvatar name={student.name} tint={student.avatarTint} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{localizedGapType(type, language).label}</p>
                </div>
                <StatusBadge urgency={urgencyForGap(g)} />
              </Link>
            );
          })}
        </section>
      )}

      <section className="space-y-3">          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-secondary" strokeWidth={2.2} />
              <h2 className="font-heading text-lg font-bold">{t(language, "home.smallGroups")}</h2>
            </div>
            <Link to="/class" className="text-sm font-semibold text-primary">
              {t(language, "home.classWall")}
            </Link>
          </div>
          {suggested.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              {t(language, "home.noGroups")}
            </div>
          ) : (
          suggested.map((g) => (
            <div key={g.gapTypeId} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="font-heading text-[15px] font-bold">{g.title}</p>
              <p className="text-sm text-muted-foreground">{g.reason}</p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">{t(language, "home.yourStudents")}</h2>
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link to="/students/new">
              <Plus className="h-4 w-4" />
              {t(language, "home.add")}
            </Link>
          </Button>
        </div>
        {roster.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            {t(language, "home.addFirst")}
          </p>
        ) : (
          roster.map((student) => {
            const open = gaps.filter((g) => g.studentId === student.id && g.status === "active");
            const top = open.sort((a, b) => urgencyRank(urgencyForGap(a)) - urgencyRank(urgencyForGap(b)))[0];
            return (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft"
              >
                <Link to={`/students/${student.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <StudentAvatar name={student.name} tint={student.avatarTint} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-[15px] font-bold">{student.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t(language, "home.gradeRoll", { grade: student.grade, roll: student.rollNo })}
                      {!student.lastAssessedAt ? ` · ${t(language, "home.notAssessed")}` : ""}
                    </p>
                    {top && (
                      <div className="mt-1.5">
                        <StatusBadge urgency={urgencyForGap(top)} />
                      </div>
                    )}
                  </div>
                </Link>
                <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-full">
                  <Link to={`/assess?student=${student.id}`}>{t(language, "home.assess")}</Link>
                </Button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function urgencyRank(u: ReturnType<typeof urgencyForGap>) {
  return { persistent: 0, watch: 1, new: 2 }[u];
}
