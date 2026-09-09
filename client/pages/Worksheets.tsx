import { Link } from "react-router-dom";
import { useApp } from "@/state/AppProvider";
import { formatShortDate } from "@/domain/ids";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, localizedSheet, t } from "@/lib/i18n";
import type { Grade, WorksheetInstance } from "@/domain/types";

export default function Worksheets() {
  const { snapshot, ready, language } = useApp();
  if (!ready) return null;

  const byGrade = new Map<Grade, WorksheetInstance[]>();
  for (const sheet of snapshot.worksheets) {
    const student = snapshot.students.find((s) => s.id === sheet.studentId);
    if (!student) continue;
    const list = byGrade.get(student.grade) ?? [];
    list.push(sheet);
    byGrade.set(student.grade, list);
  }
  const allGrades: Grade[] = [1, 2, 3];
  const gradesWithSheets = allGrades.filter((g) => byGrade.has(g));
  const total = snapshot.worksheets.length;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-heading text-2xl font-bold">{t(language, "ws.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(language, "ws.classIntro", { n: total })}
        </p>
      </section>

      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t(language, "ws.empty")}
        </p>
      ) : (
        <div className="space-y-6">
          {gradesWithSheets.map((grade) => {
            const sheets = (byGrade.get(grade) ?? []).sort(
              (a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt),
            );
            return (
              <section key={grade} className="space-y-3">
                <Link
                  to={`/class/grade/${grade}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-accent/70 px-4 py-2.5"
                >
                  <span className="font-heading text-base font-bold text-primary">
                    {t(language, "class.grade", { grade })}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {t(language, "ws.sheets", { n: sheets.length })}
                  </span>
                </Link>
                {sheets.map((sheet) => {
                  const view = localizedSheet(sheet, language);
                  const student = snapshot.students.find((s) => s.id === sheet.studentId);
                  const gap = snapshot.gaps.find((g) => g.id === sheet.gapRecordId);
                  if (!student) return null;
                  const gapLabel = gap ? getGapType(gap.gapTypeId) : undefined;
                  return (
                    <Link
                      key={sheet.id}
                      to={`/worksheets/${sheet.id}`}
                      className="block rounded-2xl border border-border bg-card p-4 shadow-soft"
                    >
                      <p className="font-heading font-bold">{view.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.name} · {formatShortDate(view.assignedAt)} ·{" "}
                        {t(language, "ws.tier", { tier: view.tier })}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm">
                        {gapLabel ? localizedGapType(gapLabel, language).label : ""}
                        {sheet.status === "practiced" && (
                          <span className="shrink-0 rounded-full bg-status-ontrack/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-ontrack-foreground">
                            {t(language, "ws.practiced")}
                          </span>
                        )}
                      </p>
                    </Link>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}