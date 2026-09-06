import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/AppProvider";
import { toAggregatedReport } from "@/domain/class-overview";
import { formatShortDate } from "@/domain/ids";

export default function Sync() {
  const { snapshot, ready, flushSync, updateClassroom, reloadDemo } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  const preview = toAggregatedReport(snapshot.students, snapshot.gaps);
  const pending = snapshot.syncQueue.filter((i) => i.status !== "synced").length;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Sync & settings</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Core work never needs the internet. When you have a connection, only anonymised gap-type
        counts are sent — no names, rolls, or student IDs.
      </p>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-heading text-lg font-bold">On this phone</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{snapshot.storageNote}</p>
        <p className="mt-2 text-sm">
          {snapshot.students.length} students · {snapshot.gaps.filter((g) => g.status === "active").length} open gaps
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
        <h2 className="font-heading text-lg font-bold">Reporting preview</h2>
        <p className="text-xs text-muted-foreground">
          Class size band {preview.classSizeBand} · {preview.gapTypes.length} gap types
        </p>
        {preview.gapTypes.map((g) => (
          <p key={g.gapTypeId} className="text-sm">
            {g.label} — {g.studentCount} students
          </p>
        ))}
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
          {busy ? "Trying the reporting endpoint…" : "Sync anonymised totals"}
        </Button>
        {pending > 0 && (
          <p className="text-sm text-muted-foreground">{pending} item(s) waiting in the local queue.</p>
        )}
        {message && <p className="text-sm">{message}</p>}
        <div className="space-y-1 text-xs text-muted-foreground">
          {snapshot.syncQueue.slice(-5).reverse().map((item) => (
            <p key={item.id}>
              {item.status} · {formatShortDate(item.createdAt)}
              {item.syncedAt ? ` · sent ${formatShortDate(item.syncedAt)}` : ""}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
        <h2 className="font-heading text-lg font-bold">Class</h2>
        <label className="block text-sm font-semibold">
          Class name
          <input
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 font-normal"
            defaultValue={snapshot.classroom.name}
            onBlur={(e) => updateClassroom({ name: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold">
          Reassess after
          <select
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 font-normal"
            value={snapshot.classroom.reassessmentDays}
            onChange={(e) =>
              updateClassroom({ reassessmentDays: Number(e.target.value) as 7 | 14 })
            }
          >
            <option value={7}>1 week (7 days)</option>
            <option value={14}>2 weeks (14 days)</option>
          </select>
        </label>
        <p className="text-sm text-muted-foreground">
          Rotation assumes about {snapshot.classroom.studentsPerDay} students a day.
        </p>
        <Link to="/class" className="block text-sm font-semibold text-primary">
          Open class wall
        </Link>
      </section>

      <Button variant="outline" className="w-full rounded-full" onClick={() => reloadDemo()}>
        Reload demo class on this phone
      </Button>
    </div>
  );
}
