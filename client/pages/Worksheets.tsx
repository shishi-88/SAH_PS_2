import { Link } from "react-router-dom";
import { useApp } from "@/state/AppProvider";
import { formatShortDate } from "@/domain/ids";
import { getGapType } from "@/domain/competency-registry";

export default function Worksheets() {
  const { snapshot, ready } = useApp();
  if (!ready) return null;
  const sheets = [...snapshot.worksheets].sort(
    (a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt),
  );

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">Practice sheets</h1>
      <p className="text-sm text-muted-foreground">
        Each sheet comes from the tagged bank and is tied to a diagnosed gap — not a generic grade pack.
      </p>
      {sheets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No sheets yet. Finish an assessment to generate one.
        </p>
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet) => {
            const student = snapshot.students.find((s) => s.id === sheet.studentId);
            const gap = snapshot.gaps.find((g) => g.id === sheet.gapRecordId);
            if (!student) return null;
            return (
              <Link
                key={sheet.id}
                to={`/worksheets/${sheet.id}`}
                className="block rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <p className="font-heading font-bold">{sheet.title}</p>
                <p className="text-sm text-muted-foreground">
                  {student.name} · {formatShortDate(sheet.assignedAt)} · tier {sheet.tier}
                </p>
                <p className="mt-1 text-sm">{getGapType(gap?.gapTypeId ?? "")?.label}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
