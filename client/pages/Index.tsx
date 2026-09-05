import { Link } from "react-router-dom";
import { Mic, Users2, CalendarCheck2, ArrowRight, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { students, getGapGroups } from "@/lib/mock-data";

const STUDENTS_PER_DAY = 5;

export default function Index() {
  const total = students.length;
  const assessedThisWeek = students.filter((s) => s.assessedThisWeek).length;
  const remaining = total - assessedThisWeek;
  const daysLeft = Math.max(1, Math.ceil(remaining / STUDENTS_PER_DAY));
  const progressPct = Math.round((assessedThisWeek / total) * 100);

  const groups = getGapGroups().slice(0, 3);

  const roster = [...students].sort((a, b) => {
    const rank = { priority: 0, attention: 1, ontrack: 2 } as const;
    const aStatus = a.gaps.some((g) => g.status === "priority")
      ? "priority"
      : a.gaps.some((g) => g.status === "attention")
        ? "attention"
        : "ontrack";
    const bStatus = b.gaps.some((g) => g.status === "priority")
      ? "priority"
      : b.gaps.some((g) => g.status === "attention")
        ? "attention"
        : "ontrack";
    return rank[aStatus] - rank[bStatus];
  });

  return (
    <div className="space-y-7">
      <section className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Good morning, Teacher
        </p>
        <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground sm:text-3xl">
          Class 1–3 · Room reading corner
        </h1>
      </section>

      <Link
        to="/assess"
        className="group flex items-center gap-4 rounded-3xl bg-primary px-5 py-5 text-primary-foreground shadow-card transition-transform active:scale-[0.99]"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <Mic className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <span className="flex-1">
          <span className="block font-heading text-lg font-bold">
            Assess a student
          </span>
          <span className="block text-sm text-primary-foreground/85">
            Record a 30–60 sec reading or counting sample
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <CalendarCheck2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-heading text-base font-bold text-foreground">
                This week's coverage
              </p>
              <p className="text-sm text-muted-foreground">
                {assessedThisWeek} of {total} students assessed
              </p>
            </div>
          </div>
          <span className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary">
            {progressPct}%
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          At about {STUDENTS_PER_DAY} students a day, you'll reach everyone in
          roughly {daysLeft} more school day{daysLeft === 1 ? "" : "s"}.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkle className="h-4 w-4 text-secondary" strokeWidth={2.2} />
          <h2 className="font-heading text-lg font-bold text-foreground">
            Focus for small groups this week
          </h2>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            No open gaps yet — assess a few students to see suggested groups
            here.
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.templateId}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={group.severity} />
                    <span className="text-xs text-muted-foreground">
                      {group.weeksActive === 0
                        ? "Newly detected"
                        : `Unresolved for ${group.weeksActive} week${group.weeksActive === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <p className="font-heading text-[15px] font-bold text-foreground">
                    {group.template.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {group.studentIds.length} student
                    {group.studentIds.length === 1 ? "" : "s"} · Grade{" "}
                    {group.template.grade}
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {group.studentIds.slice(0, 3).map((id) => {
                    const student = students.find((s) => s.id === id)!;
                    return (
                      <StudentAvatar
                        key={id}
                        student={student}
                        size="sm"
                        className="border-2 border-card"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-secondary" strokeWidth={2.2} />
          <h2 className="font-heading text-lg font-bold text-foreground">
            Your students
          </h2>
        </div>
        <div className="space-y-2.5">
          {roster.map((student) => {
            const topGap = student.gaps.find((g) => g.status === "priority") ??
              student.gaps.find((g) => g.status === "attention");
            return (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft"
              >
                <StudentAvatar student={student} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-[15px] font-bold text-foreground">
                    {student.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    Grade {student.grade} · Roll {student.rollNo}
                    {!student.lastAssessed && " · Not yet assessed"}
                  </p>
                  {topGap && (
                    <div className="mt-1.5">
                      <StatusBadge status={topGap.status} />
                    </div>
                  )}
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="shrink-0 rounded-full"
                >
                  <Link to={`/assess?student=${student.id}`}>Assess</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
