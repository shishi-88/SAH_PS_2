import { Link } from "react-router-dom";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { buildGapGroups, suggestSmallGroups } from "@/domain/class-overview";
import { getGapType } from "@/domain/competency-registry";

export default function ClassWall() {
  const { snapshot, ready } = useApp();
  if (!ready) return null;
  const groups = buildGapGroups(snapshot.gaps);
  const suggested = suggestSmallGroups(groups, 3);

  return (
    <div className="space-y-7">
      <section>
        <h1 className="font-heading text-2xl font-bold">Class wall</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Shared skill gaps — not scores, not ranks. Persistent gaps (3+ weeks) sit higher than newly noticed ones.
        </p>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
          No open gaps on the wall yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <article key={g.gapTypeId} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <StatusBadge urgency={g.urgency} />
              <h2 className="mt-3 font-heading text-lg font-bold leading-snug">{g.label}</h2>
              <p className="mt-1 font-heading text-3xl font-extrabold text-primary">{g.studentCount}</p>
              <p className="text-sm text-muted-foreground">
                student{g.studentCount === 1 ? "" : "s"}
                {g.persistentCount ? ` · ${g.persistentCount} extra time` : ""}
                {g.newlyDetectedCount ? ` · ${g.newlyDetectedCount} new` : ""}
              </p>
              <div className="mt-3 flex -space-x-2">
                {g.studentIds.slice(0, 6).map((id) => {
                  const s = snapshot.students.find((st) => st.id === id);
                  if (!s) return null;
                  return (
                    <StudentAvatar
                      key={id}
                      name={s.name}
                      tint={s.avatarTint}
                      size="sm"
                      className="border-2 border-card"
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">Suggested small groups</h2>
        {suggested.length === 0 ? (
          <p className="text-sm text-muted-foreground">Assess a few children to form groups.</p>
        ) : (
          suggested.map((g, i) => (
            <div key={g.gapTypeId} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Group {i + 1}
              </p>
              <p className="font-heading text-base font-bold">{getGapType(g.gapTypeId)?.label ?? g.title}</p>
              <p className="text-sm text-muted-foreground">{g.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.studentIds.map((id) => {
                  const s = snapshot.students.find((st) => st.id === id);
                  if (!s) return null;
                  return (
                    <Link
                      key={id}
                      to={`/students/${id}`}
                      className="rounded-full bg-accent px-3 py-1 text-sm font-semibold"
                    >
                      {s.name.split(" ")[0]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
