import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Download,
  History,
  LogOut,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Users,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/state/AppProvider";
import { toAggregatedReport } from "@/domain/class-overview";
import { formatShortDate } from "@/domain/ids";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";
import { STORAGE_NOTE_ENCRYPTED } from "@/data/storage";
import type { SyncQueueItem } from "@/domain/types";

export default function Sync() {
  const navigate = useNavigate();
  const { snapshot, ready, flushSync, updateClassroom, reloadDemo, session, switchTeacher, language } = useApp();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!ready) return null;
  const preview = toAggregatedReport(snapshot.students, snapshot.gaps);
  const pending = snapshot.syncQueue.filter((i) => i.status !== "synced").length;
  const openGaps = snapshot.gaps.filter((g) => g.status === "active").length;
  const storageNoteKey =
    snapshot.storageNote === STORAGE_NOTE_ENCRYPTED ? "sync.storageEncrypted" : "sync.storagePlain";

  const lastSyncedAt = snapshot.syncQueue
    .filter((i) => i.syncedAt)
    .map((i) => i.syncedAt!)
    .sort()
    .pop();

  const [copied, setCopied] = useState(false);

  const getOfflinePackage = () => {
    return {
      format: "sahayak-offline-bundle",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: "mobile-teacher-app",
      teacher: session
        ? {
            id: session.teacherId,
            name: session.teacherName,
            schoolName: session.schoolName,
          }
        : {
            name: snapshot.classroom.teacherLabel,
            schoolName: snapshot.classroom.schoolName,
          },
      classroom: snapshot.classroom,
      students: snapshot.students,
      gaps: snapshot.gaps,
      assessments: snapshot.assessments,
      worksheets: snapshot.worksheets,
      syncQueue: snapshot.syncQueue,
    };
  };

  const handleExportOfflineData = () => {
    const pkg = getOfflinePackage();
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sahayak_offline_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyOfflineJson = async () => {
    const pkg = getOfflinePackage();
    try {
      await navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      handleExportOfflineData();
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <RefreshCw className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold">{t(language, "sync.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t(language, "sync.intro")}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-ontrack/15 text-status-ontrack-foreground">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold">{t(language, "sync.onPhone")}</h2>
            <p className="text-sm text-muted-foreground">
              {t(language, "sync.counts", { students: snapshot.students.length, gaps: openGaps })}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(language, storageNoteKey)}
        </p>
      </section>

      {/* Offline Data Export for Central Portal Ingestion */}
      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Download className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold">
              {language === "hi" ? "ऑफ़लाइन डेटा निर्यात करें" : "Export Offline Package"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {language === "hi"
                ? "बिना इंटरनेट के वेब पोर्टल में आयात करने के लिए JSON फ़ाइल डाउनलोड करें"
                : "Save your classroom records to a JSON file to import into the Web Portal offline"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full rounded-full gap-2 border-border font-semibold text-xs"
            onClick={handleExportOfflineData}
          >
            <Download className="h-4 w-4" />
            {language === "hi" ? "डाउनलोड फ़ाइल (.json)" : "Download File (.json)"}
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-full gap-2 border-border bg-muted/40 hover:bg-muted font-semibold text-xs transition-all"
            onClick={handleCopyOfflineJson}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">
                  {language === "hi" ? "क्लिपबोर्ड पर कॉपी हो गया!" : "Copied to Clipboard!"}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-primary" />
                <span>{language === "hi" ? "JSON डेटा कॉपी करें" : "Copy JSON Data"}</span>
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <CloudUpload className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold">{t(language, "sync.reportTitle")}</h2>
              <p className="text-xs text-muted-foreground">
                {t(language, "sync.band", { band: preview.classSizeBand, types: preview.gapTypes.length })}
              </p>
            </div>
          </div>
          <span
            className={
              lastSyncedAt
                ? "shrink-0 rounded-full bg-status-ontrack/15 px-3 py-1 text-xs font-semibold text-status-ontrack-foreground"
                : "shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
            }
          >
            {lastSyncedAt
              ? t(language, "sync.lastSynced", { date: formatShortDate(lastSyncedAt) })
              : t(language, "sync.neverSynced")}
          </span>
        </div>

        {preview.gapTypes.length > 0 && (
          <ul className="space-y-1.5 rounded-2xl bg-accent/50 p-3">
            {preview.gapTypes.map((g) => {
              const type = getGapType(g.gapTypeId);
              const label = type ? localizedGapType(type, language).label : g.label;
              return (
                <li key={g.gapTypeId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{label}</span>
                  <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 font-heading text-xs font-bold text-primary">
                    {g.studentCount}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          className="w-full rounded-full"
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setResult(null);
            const res = await flushSync();
            setResult({ ok: res.ok, text: res.message });
            setBusy(false);
          }}
        >
          {busy ? t(language, "sync.trying") : t(language, "sync.syncTotals")}
        </Button>

        {pending > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {t(language, "sync.waiting", { n: pending })}
          </p>
        )}

        {result && (
          <p
            className={
              result.ok
                ? "flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-status-ontrack-foreground"
                : "flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-status-priority-foreground"
            }
          >
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {result.text}
          </p>
        )}

        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" strokeWidth={2.1} />
            <h3 className="font-heading text-sm font-bold text-foreground">
              {t(language, "sync.queueTitle")}
            </h3>
          </div>
          {snapshot.syncQueue.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t(language, "sync.queueEmpty")}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {snapshot.syncQueue.slice(-5).reverse().map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{formatShortDate(item.createdAt)}</span>
                  <SyncStatusBadge item={item} language={language} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Settings2 className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <h2 className="font-heading text-base font-bold">{t(language, "sync.class")}</h2>
        </div>
        <label className="block text-sm font-semibold">
          {t(language, "sync.className")}
          <input
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 font-normal"
            defaultValue={snapshot.classroom.name}
            onBlur={(e) => updateClassroom({ name: e.target.value })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t(language, "sync.reassessAfter")}
            <select
              className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 font-normal"
              value={snapshot.classroom.reassessmentDays}
              onChange={(e) =>
                updateClassroom({ reassessmentDays: Number(e.target.value) as 7 | 14 })
              }
            >
              <option value={7}>{t(language, "sync.oneWeek")}</option>
              <option value={14}>{t(language, "sync.twoWeeks")}</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t(language, "sync.studentsPerDay")}
            <select
              className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 font-normal"
              value={snapshot.classroom.studentsPerDay}
              onChange={(e) =>
                updateClassroom({ studentsPerDay: Number(e.target.value) })
              }
            >
              {[3, 5, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {t(language, "sync.rotationAssumes", { n: snapshot.classroom.studentsPerDay })}
        </p>
        <Link to="/class" className="block text-sm font-semibold text-primary">
          {t(language, "sync.openClassWall")}
        </Link>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-priority/15 text-status-priority-foreground">
            <LogOut className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold">{t(language, "sync.switchTitle")}</h2>
            <p className="text-xs text-muted-foreground">
              {session
                ? `${session.teacherName}${session.schoolName ? ` · ${session.schoolName}` : ""} · ${session.classroomName}`
                : t(language, "sync.switchIntro")}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full rounded-full">
              {t(language, "sync.switchAction")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t(language, "sync.switchConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t(language, "sync.switchConfirmBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t(language, "sync.switchCancel")}</AlertDialogCancel>
              <AlertDialogAction
                disabled={switching}
                onClick={async () => {
                  setSwitching(true);
                  await switchTeacher();
                  setSwitching(false);
                  navigate("/setup");
                }}
              >
                {t(language, "sync.switchConfirmAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <section className="rounded-3xl border border-dashed border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold">
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          {t(language, "sync.demoTitle")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t(language, "sync.demoNote")}</p>
        <Button variant="outline" className="mt-3 w-full rounded-full" onClick={() => reloadDemo()}>
          {t(language, "sync.reloadDemo")}
        </Button>
      </section>
    </div>
  );
}

function SyncStatusBadge({
  item,
  language,
}: {
  item: SyncQueueItem;
  language: import("@/lib/i18n").Language;
}) {
  const config =
    item.status === "synced"
      ? { key: "sync.statusSynced", cls: "bg-status-ontrack/15 text-status-ontrack-foreground" }
      : item.status === "failed"
        ? { key: "sync.statusFailed", cls: "bg-status-priority/20 text-status-priority-foreground" }
        : { key: "sync.statusPending", cls: "bg-status-attention/20 text-status-attention-foreground" };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 font-semibold ${config.cls}`}>
      {t(language, config.key)}
    </span>
  );
}