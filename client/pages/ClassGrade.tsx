import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import GapWall from "@/components/GapWall";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { gradeStats, urgencyForGap } from "@/domain/class-overview";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";
import type { Grade } from "@/domain/types";

export default function ClassGrade() {
  const { grade: gradeParam } = useParams();
  const { snapshot, ready, language } = useApp();
  if (!ready) return null;

  const grade = (Number(gradeParam) as Grade) || 1;
  const { students, gaps } = snapshot;
  const inGrade = students
    .filter((s) => s.grade === grade)
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  const gradeGaps = gaps.filter((g) => inGrade.some((s) => s.id === g.studentId));
  const stats = gradeStats(students, gaps, grade);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link to="/class" aria-label={t(language, "class.back")}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">
            {t(language, "class.grade", { grade })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(language, "class.students", { n: stats.total })} ·{" "}
            {t(language, "class.assessed", { n: stats.assessedCount })}
            {stats.dueCount > 0 ? ` · ${t(language, "class.due", { n: stats.dueCount })}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1 rounded-full" size="lg">
          <Link to={`/assess?grade=${grade}`}>
            <Mic className="h-4 w-4" />
            {t(language, "class.assessGrade")}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1 rounded-full" size="lg">
          <Link to={`/students/new?grade=${grade}`}>
            <Plus className="h-4 w-4" />
            {t(language, "class.addStudent")}
          </Link>
        </Button>
      </div>

      <section className="space-y-3">
        {inGrade.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t(language, "class.noStudents", { grade })}
            </p>
            <Button asChild variant="secondary" className="mt-4 rounded-full">
              <Link to={`/students/new?grade=${grade}`}>{t(language, "class.addStudent")}</Link>
            </Button>
          </div>
        ) : (
          inGrade.map((student) => {
            const open = gradeGaps
              .filter((g) => g.studentId === student.id && g.status === "active")
              .sort((a, b) => urgencyRank(urgencyForGap(a)) - urgencyRank(urgencyForGap(b)));
            const top = open[0];
            const topType = top ? getGapType(top.gapTypeId) : undefined;
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
                    {topType && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {localizedGapType(topType, language).label}
                      </p>
                    )}
                  </div>
                </Link>
                {top ? (
                  <StatusBadge urgency={urgencyForGap(top)} />
                ) : (
                  <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-full">
                    <Link to={`/assess?student=${student.id}`}>{t(language, "home.assess")}</Link>
                  </Button>
                )}
              </div>
            );
          })
        )}
      </section>

      <GapWall gaps={gradeGaps} students={inGrade} />
    </div>
  );
}

function urgencyRank(u: ReturnType<typeof urgencyForGap>) {
  return { persistent: 0, watch: 1, new: 2 }[u];
}