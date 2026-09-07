import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WorksheetPreview from "@/components/WorksheetPreview";
import { useApp } from "@/state/AppProvider";
import { t } from "@/lib/i18n";

export default function WorksheetDetail() {
  const { id } = useParams();
  const { snapshot, ready, language } = useApp();
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row">
        <Button className="rounded-full" size="lg" onClick={() => window.print()}>
          {t(language, "wsd.print")}
        </Button>
        <Button asChild variant="secondary" className="rounded-full" size="lg">
          <Link to={`/students/${student.id}`}>{t(language, "wsd.studentRecord")}</Link>
        </Button>
      </div>
      <WorksheetPreview sheet={sheet} student={student} gapTypeId={gap?.gapTypeId} />
    </div>
  );
}
