import { Link } from "react-router-dom";
import { useApp } from "@/state/AppProvider";
import { formatShortDate } from "@/domain/ids";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, localizedSheet, t } from "@/lib/i18n";

export default function Worksheets() {
  const { snapshot, ready, language } = useApp();
  if (!ready) return null;
  const sheets = [...snapshot.worksheets].sort(
    (a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt),
  );

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">{t(language, "ws.title")}</h1>
      <p className="text-sm text-muted-foreground">{t(language, "ws.intro")}</p>
      {sheets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t(language, "ws.empty")}
        </p>
      ) : (
        <div className="space-y-3">
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
                  {student.name} · {formatShortDate(view.assignedAt)} · {t(language, "ws.tier", { tier: view.tier })}
                </p>
                <p className="mt-1 text-sm">
                  {gapLabel ? localizedGapType(gapLabel, language).label : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
