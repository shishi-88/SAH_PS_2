import { useState } from "react";
import { BookOpen, GraduationCap, School, Sparkles, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/AppProvider";
import { t } from "@/lib/i18n";

export default function Setup() {
  const { language, snapshot, completeSetup, ready } = useApp();
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [classroomName, setClassroomName] = useState(
    snapshot.classroom.name && snapshot.classroom.name !== "Morning section · Class 1–3"
      ? snapshot.classroom.name
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [offlineNote, setOfflineNote] = useState(false);

  if (!ready) {
    return (
      <p className="py-16 text-center text-muted-foreground">{t(language, "setup.loading")}</p>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10 sm:px-6">
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <BookOpen className="h-6 w-6" strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold">{t(language, "setup.title")}</h1>
              <p className="text-sm text-muted-foreground">{t(language, "setup.subtitle")}</p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!teacherName.trim() || !classroomName.trim()) return;
              setBusy(true);
              try {
                await completeSetup({
                  teacherName: teacherName.trim(),
                  schoolName: schoolName.trim() || undefined,
                  classroomName: classroomName.trim(),
                });
              } catch {
                setOfflineNote(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="block text-sm font-semibold">
              {t(language, "setup.teacherName")}
              <input
                required
                autoFocus
                className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 text-base font-normal"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder={t(language, "setup.teacherPlaceholder")}
              />
            </label>

            <label className="block text-sm font-semibold">
              {t(language, "setup.schoolName")}
              <input
                className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 text-base font-normal"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder={t(language, "setup.schoolPlaceholder")}
              />
            </label>

            <label className="block text-sm font-semibold">
              {t(language, "setup.classroomName")}
              <input
                required
                className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 text-base font-normal"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                placeholder={t(language, "setup.classroomPlaceholder")}
              />
            </label>

            <Button className="w-full rounded-full" size="lg" disabled={busy}>
              {busy ? t(language, "setup.saving") : t(language, "setup.continue")}
            </Button>
          </form>

          <div className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              {t(language, "setup.once")}
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0 text-secondary" />
              {t(language, "setup.returns")}
            </p>
            {offlineNote ? (
              <p className="flex items-center gap-2 text-status-attention-foreground">
                <WifiOff className="h-4 w-4 shrink-0" />
                {t(language, "setup.offlineFallback")}
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <School className="h-4 w-4 shrink-0 text-muted-foreground" />
                {t(language, "setup.offline")}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}