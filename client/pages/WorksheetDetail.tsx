import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorksheetPreview from "@/components/WorksheetPreview";
import { useApp } from "@/state/AppProvider";
import { t } from "@/lib/i18n";

export default function WorksheetDetail() {
  const { id } = useParams();
  const { snapshot, ready, language, markPracticed } = useApp();
  if (!ready) return null;
  const sheet = snapshot.worksheets.find((w) => w.id === id);
  const student = sheet ? snapshot.students.find((s) => s.id === sheet.studentId) : undefined;
  const gap = sheet ? snapshot.gaps.find((g) => g.id === sheet.gapRecordId) : undefined;

  if (!sheet || !student) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(language, "wsd.notFound")} <Link to="/worksheets">{t(language, "ws.title")}</Link>
      </p>
    );
  }

  const practiced = sheet.status === "practiced";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row">
        <Button className="rounded-full" size="lg" onClick={() => window.print()}>
          {t(language, "wsd.print")}
        </Button>
        {practiced ? (
          <span className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-status-ontrack/15 px-5 py-3 font-heading text-sm font-bold text-status-ontrack-foreground sm:flex-none">
            <CheckCircle2 className="h-4 w-4" />
            {t(language, "wsd.practicedDone")}
          </span>
        ) : (
          <Button
            variant="secondary"
            className="flex-1 rounded-full sm:flex-none"
            size="lg"
            onClick={async () => {
              await markPracticed(sheet.id);
            }}
          >
            {t(language, "wsd.markPracticed")}
          </Button>
        )}
        <Button asChild variant="outline" className="rounded-full" size="lg">
          <Link to={`/students/${student.id}`}>{t(language, "wsd.studentRecord")}</Link>
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground print:hidden">
        {t(language, "wsd.practiceHint")}
      </p>
      <WorksheetPreview sheet={sheet} student={student} gapTypeId={gap?.gapTypeId} />
    </div>
  );
}
