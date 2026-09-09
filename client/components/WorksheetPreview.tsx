import { BookOpen, Calculator, Circle, ListOrdered, PenLine, Puzzle, Split } from "lucide-react";
import { formatShortDate } from "@/domain/ids";
import type { Student, WorksheetInstance, WorksheetItemKind } from "@/domain/types";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, localizedSheet, t } from "@/lib/i18n";
import { useApp } from "@/state/AppProvider";

const KIND_META: Record<WorksheetItemKind, { labelKey: string; icon: typeof BookOpen }> = {
  read: { labelKey: "wp.read", icon: BookOpen },
  write: { labelKey: "wp.write", icon: PenLine },
  circle: { labelKey: "wp.circle", icon: Circle },
  match: { labelKey: "wp.match", icon: Split },
  fill: { labelKey: "wp.fill", icon: Puzzle },
  sequence: { labelKey: "wp.sequence", icon: ListOrdered },
  solve: { labelKey: "wp.solve", icon: Calculator },
};

export default function WorksheetPreview({
  sheet,
  student,
  gapTypeId,
}: {
  sheet: WorksheetInstance;
  student: Student;
  gapTypeId?: string;
}) {
  const { language } = useApp();
  const view = localizedSheet(sheet, language);
  const gap = gapTypeId ? getGapType(gapTypeId) : undefined;
  const gapLabel = gap ? localizedGapType(gap, language).label : undefined;
  return (
    <article className="rounded-3xl border border-border bg-card p-6 shadow-soft print:rounded-none print:border-0 print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t(language, "wp.practiceSheet", { tier: view.tier })}
      </p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">{view.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{view.focus}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="text-muted-foreground">{t(language, "wp.student")}</span>
          <br />
          <span className="font-semibold">{student.name}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t(language, "wp.gradeRollLabel")}</span>
          <br />
          <span className="font-semibold">
            {t(language, "wp.gradeRoll", { grade: student.grade, roll: student.rollNo })}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">{t(language, "wp.date")}</span>
          <br />
          <span className="font-semibold">{formatShortDate(view.assignedAt)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t(language, "wp.focusGap")}</span>
          <br />
          <span className="font-semibold">{gapLabel ?? t(language, "wp.linkedGap")}</span>
        </p>
      </div>
      <ol className="mt-6 space-y-3">
        {view.items.map((item, i) => {
          const meta = item.kind ? KIND_META[item.kind] : undefined;
          return (
            <li
              key={i}
              className="rounded-2xl bg-accent/80 px-4 py-3 text-[15px] leading-relaxed"
            >
              <span className="mr-2 font-heading font-bold text-primary">{i + 1}.</span>
              {meta && (
                <span className="mr-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  <meta.icon className="h-3 w-3" />
                  {t(language, meta.labelKey)}
                </span>
              )}
              <span>{item.prompt}</span>
              {item.hint ? (
                <span className="mt-1 block text-sm text-muted-foreground">{item.hint}</span>
              ) : null}
              {item.kind === "write" || item.kind === "fill" || item.kind === "solve" ? (
                <span className="mt-3 block h-8 w-full border-b-2 border-dotted border-border/80" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t(language, "wp.footer")}</p>
    </article>
  );
}
