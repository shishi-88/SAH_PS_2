import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import GapWall from "@/components/GapWall";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { gradeStats } from "@/domain/class-overview";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";
import type { Grade } from "@/domain/types";

const GRADES: Grade[] = [1, 2, 3];

export default function ClassOverview() {
  const { snapshot, ready, language } = useApp();
  if (!ready) return null;
  const { students, gaps } = snapshot;
  const stats = GRADES.map((g) => gradeStats(students, gaps, g));

  return (
    <div className="space-y-7">
      <section>
        <h1 className="font-heading text-2xl font-bold">{t(language, "class.title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t(language, "class.subtitle")}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.grade}
            to={`/class/grade/${s.grade}`}
            className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-primary">
                {t(language, "class.grade", { grade: s.grade })}
              </h2>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 font-heading text-3xl font-extrabold text-foreground">{s.total}</p>
            <p className="text-sm text-muted-foreground">
              {t(language, "class.students", { n: s.total })}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className="rounded-full bg-primary/12 px-2.5 py-1 text-primary">
                {t(language, "class.assessed", { n: s.assessedCount })}
              </span>
              {s.dueCount > 0 && (
                <span className="rounded-full bg-status-attention/20 text-status-attention-foreground">
                  {t(language, "class.due", { n: s.dueCount })}
                </span>
              )}
              {s.dueCount === 0 && s.total > 0 && (
                <span className="rounded-full bg-status-ontrack/15 text-status-ontrack-foreground">
                  {t(language, "class.allCurrent")}
                </span>
              )}
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t(language, "class.topGaps")}
              </p>
              {s.topGapTypeIds.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">{t(language, "class.noGaps")}</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {s.topGapTypeIds.map(({ gapTypeId, count }) => {
                    const type = getGapType(gapTypeId);
                    if (!type) return null;
                    return (
                      <li key={gapTypeId} className="flex items-center gap-2 text-sm">
                        <StatusBadge urgency="new" className="shrink-0 px-2 py-0.5 text-[10px]" />
                        <span className="min-w-0 flex-1 truncate">
                          {localizedGapType(type, language).label}
                        </span>
                        <span className="shrink-0 font-heading font-bold text-primary">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {s.total === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">{t(language, "class.empty")}</p>
            )}
          </Link>
        ))}
      </div>

      <Link
        to="/students/new"
        className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-primary shadow-soft"
      >
        <Plus className="h-4 w-4" />
        {t(language, "class.addStudent")}
      </Link>

      <GapWall gaps={gaps} students={students} />
    </div>
  );
}