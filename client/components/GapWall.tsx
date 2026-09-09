import { Link } from "react-router-dom";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { buildGapGroups, suggestSmallGroups } from "@/domain/class-overview";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";
import type { SkillGapRecord, Student } from "@/domain/types";

export default function GapWall({
  gaps,
  students,
}: {
  gaps: SkillGapRecord[];
  students: Student[];
}) {
  const { language } = useApp();
  const groups = buildGapGroups(gaps);
  const suggested = suggestSmallGroups(groups, 3, language);

  return (
    <div className="space-y-7">
      <section>
        <h2 className="font-heading text-lg font-bold">{t(language, "wall.title")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t(language, "wall.intro")}
        </p>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
          {t(language, "wall.empty")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const type = getGapType(g.gapTypeId);
            const label = type ? localizedGapType(type, language).label : g.label;
            return (
              <article key={g.gapTypeId} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <StatusBadge urgency={g.urgency} />
                <h3 className="mt-3 font-heading text-lg font-bold leading-snug">{label}</h3>
                <p className="mt-1 font-heading text-3xl font-extrabold text-primary">{g.studentCount}</p>
                <p className="text-sm text-muted-foreground">
                  {t(language, "wall.students", { s: g.studentCount === 1 ? "" : "s" })}
                  {g.persistentCount ? ` · ${g.persistentCount} ${t(language, "wall.extraTime")}` : ""}
                  {g.newlyDetectedCount ? ` · ${g.newlyDetectedCount} ${t(language, "wall.new")}` : ""}
                </p>
                <div className="mt-3 flex -space-x-2">
                  {g.studentIds.slice(0, 6).map((id) => {
                    const s = students.find((st) => st.id === id);
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
            );
          })}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">{t(language, "wall.suggested")}</h2>
        {suggested.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(language, "wall.assessFirst")}</p>
        ) : (
          suggested.map((g, i) => (
            <div key={g.gapTypeId} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(language, "wall.group", { n: i + 1 })}
              </p>
              <p className="font-heading text-base font-bold">{g.title}</p>
              <p className="text-sm text-muted-foreground">{g.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.studentIds.map((id) => {
                  const s = students.find((st) => st.id === id);
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