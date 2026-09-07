import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/AppProvider";
import { toAggregatedReport } from "@/domain/class-overview";
import { formatShortDate } from "@/domain/ids";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";
import { STORAGE_NOTE_ENCRYPTED } from "@/data/storage";

export default function Sync() {
  const { snapshot, ready, flushSync, updateClassroom, reloadDemo, language } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  const preview = toAggregatedReport(snapshot.students, snapshot.gaps);
  const pending = snapshot.syncQueue.filter((i) => i.status !== "synced").length;
  const openGaps = snapshot.gaps.filter((g) => g.status === "active").length;
  const storageNoteKey =
    snapshot.storageNote === STORAGE_NOTE_ENCRYPTED ? "sync.storageEncrypted" : "sync.storagePlain";

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t(language, "sync.title")}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{t(language, "sync.intro")}</p>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-heading text-lg font-bold">{t(language, "sync.onPhone")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(language, storageNoteKey)}
        </p>
        <p className="mt-2 text-sm">
          {t(language, "sync.counts", { students: snapshot.students.length, gaps: openGaps })}
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
        <h2 className="font-heading text-lg font-bold">{t(language, "sync.reportPreview")}</h2>
        <p className="text-xs text-muted-foreground">
          {t(language, "sync.band", {
            band: preview.classSizeBand,
            types: preview.gapTypes.length,
          })}
        </p>
        {preview.gapTypes.map((g) => {
          const type = getGapType(g.gapTypeId);
          const label = type ? localizedGapType(type, language).label : g.label;
          return (
            <p key={g.gapTypeId} className="text-sm">
              {label} — {g.studentCount} {t(language, "wall.students", { s: g.studentCount === 1 ? "" : "s" })}
            </p>
          );
        })}
        <Button
          className="w-full rounded-full"
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await flushSync();
            setMessage(result.message);
            setBusy(false);
          }}
        >
          {busy ? t(language, "sync.trying") : t(language, "sync.syncTotals")}
        </Button>
        {pending > 0 && (
          <p className="text-sm text-muted-foreground">{t(language, "sync.waiting", { n: pending })}</p>
        )}
        {message && <p className="text-sm">{message}</p>}
        <div className="space-y-1 text-xs text-muted-foreground">
          {snapshot.syncQueue.slice(-5).reverse().map((item) => (
            <p key={item.id}>
              {item.status} · {formatShortDate(item.createdAt)}
              {item.syncedAt ? ` · ${t(language, "sync.sentAt", { date: formatShortDate(item.syncedAt) })}` : ""}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
        <h2 className="font-heading text-lg font-bold">{t(language, "sync.class")}</h2>
        <label className="block text-sm font-semibold">
          {t(language, "sync.className")}
          <input
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 font-normal"
            defaultValue={snapshot.classroom.name}
            onBlur={(e) => updateClassroom({ name: e.target.value })}
          />
        </label>
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
        <p className="text-sm text-muted-foreground">
          {t(language, "sync.rotationAssumes", { n: snapshot.classroom.studentsPerDay })}
        </p>
        <Link to="/class" className="block text-sm font-semibold text-primary">
          {t(language, "sync.openClassWall")}
        </Link>
      </section>

      <Button variant="outline" className="w-full rounded-full" onClick={() => reloadDemo()}>
        {t(language, "sync.reloadDemo")}
      </Button>
    </div>
  );
}
