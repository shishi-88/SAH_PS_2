import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeftRight,
  UserCheck,
  CalendarCheck2,
  ClipboardList,
  Mic,
  Plus,
  RefreshCw,
  Users2,
  Bell,
  Sparkles,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/state/AppProvider";
import { rotationView } from "@/domain/rotation";
import {
  buildGapGroups,
  buildTodayActions,
  suggestSmallGroups,
  urgencyForGap,
} from "@/domain/class-overview";
import { getGapType } from "@/domain/competency-registry";
import { localizedGapType, t } from "@/lib/i18n";
import type { Student } from "@/domain/types";

export default function Index() {
  const navigate = useNavigate();
  const { ready, error, snapshot, language, session, switchTeacher, completeSetup } = useApp();
  if (!ready) return <p className="py-16 text-center text-muted-foreground">{t(language, "home.opening")}</p>;
  if (error) return <p className="py-16 text-center text-destructive">{error}</p>;

  const { classroom, students, gaps } = snapshot;
  const rotation = rotationView(classroom, students);
  const groups = buildGapGroups(gaps);
  const suggested = suggestSmallGroups(groups, 3, language);
  const today = buildTodayActions(classroom, students, gaps, snapshot.worksheets);
  const due = gaps.filter(
    (g) => g.status === "active" && new Date(g.reassessmentDueAt).getTime() <= Date.now(),
  );

  const roster = [...(students || [])].sort((a, b) =>
    (a.rollNo || "").toString().localeCompare((b.rollNo || "").toString(), undefined, { numeric: true })
  );

  const firstName = (s: { name: string }) => s.name?.split(" ")[0] || s.name || "";
  const nextUp = (rotation.remainingIds || [])
    .slice(0, rotation.studentsPerDay || 5)
    .map((id) => (students || []).find((s) => s.id === id))
    .filter((s): s is Student => Boolean(s));
  const readyGapByStudent = new Map<string, (typeof today.reassessGaps)[number]>();
  for (const g of today.reassessGaps) {
    if (!readyGapByStudent.has(g.studentId)) readyGapByStudent.set(g.studentId, g);
  }
  const firstReadyGap = today.reassessGaps[0];

  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <UserCheck className="h-3.5 w-3.5" />
                <span>{session?.teacherName || classroom.teacherLabel || "Teacher"}</span>
              </span>
              {classroom.schoolName && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · {classroom.schoolName}
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {classroom.name}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await switchTeacher();
                navigate("/mobile/login");
              }}
              className="rounded-2xl border-border bg-card hover:bg-muted text-xs font-semibold gap-1.5 shadow-2xs h-9 px-3"
              title={t(language, "header.switchTeacher")}
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
              <span>{t(language, "header.switchTeacher")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await switchTeacher();
                navigate("/mobile/login");
              }}
              className="rounded-2xl border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold gap-1.5 shadow-2xs h-9 px-2.5"
              title={t(language, "header.logout")}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t(language, "header.logout")}</span>
            </Button>
          </div>
        </div>

        {/* 1-Click Teacher Switch Demo Bar (Same Classroom: Class 1–3 Primary Section) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {language === "hi" ? "समान कक्षा शिक्षक स्विच:" : "Same-Class Teacher Switch:"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await completeSetup({
                  teacherName: "Prerna Sharma",
                  password: "teacher123",
                  schoolName: "GPS-104 Primary School",
                  classroomName: "Class 1–3 Primary Section (कक्षा 1–3)",
                });
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                (session?.teacherName || classroom.teacherLabel)?.toLowerCase().includes("prerna")
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs ring-2 ring-primary/20"
                  : "bg-card text-foreground hover:bg-muted border-border"
              }`}
            >
              👩‍🏫 Prerna Sharma (Reading)
            </button>
            <button
              type="button"
              onClick={async () => {
                await completeSetup({
                  teacherName: "Rajesh Verma",
                  password: "teacher123",
                  schoolName: "GPS-104 Primary School",
                  classroomName: "Class 1–3 Primary Section (कक्षा 1–3)",
                });
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                (session?.teacherName || classroom.teacherLabel)?.toLowerCase().includes("rajesh")
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-500/20"
                  : "bg-card text-foreground hover:bg-muted border-border"
              }`}
            >
              👨‍🏫 Rajesh Verma (Math)
            </button>
          </div>
        </div>
      </section>

      <Link
        to="/assess"
        className="group flex items-center gap-4 rounded-3xl bg-primary px-5 py-5 text-primary-foreground shadow-card"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <Mic className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <span className="flex-1">
          <span className="block font-heading text-lg font-bold">{t(language, "home.assessCta")}</span>
          <span className="block text-sm text-primary-foreground/85">
            {t(language, "home.assessSub")}
          </span>
        </span>
      </Link>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-secondary" strokeWidth={2.2} />
          <h2 className="font-heading text-lg font-bold">{t(language, "home.today")}</h2>
        </div>
        {today.allClear ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            {t(language, "home.todayClear")}
          </div>
        ) : (
          <div className="space-y-2.5">
            {today.assessStudents.length > 0 && (
              <ActionRow
                to="/assess"
                icon={Mic}
                tone="primary"
                title={t(language, "home.actionsAssess", {
                  n: today.assessStudents.length,
                  s: today.assessStudents.length === 1 ? "" : "s",
                })}
              >
                <StudentChips
                  items={today.assessStudents.map((s) => ({
                    label: firstName(s),
                    to: `/assess?student=${s.id}`,
                  }))}
                />
              </ActionRow>
            )}
            {firstReadyGap && (
              <ActionRow
                to={`/assess?student=${firstReadyGap.studentId}&subject=${firstReadyGap.subject}&gap=${firstReadyGap.id}`}
                icon={RefreshCw}
                tone="attention"
                title={t(language, "home.actionsReassess", {
                  n: today.reassessGaps.length,
                  s: today.reassessGaps.length === 1 ? "" : "s",
                })}
              >
                <StudentChips
                  items={today.reassessGaps.map((g) => ({
                    label: firstName(students.find((s) => s.id === g.studentId) ?? { name: "" }),
                    to: `/assess?student=${g.studentId}&subject=${g.subject}&gap=${g.id}`,
                  }))}
                />
              </ActionRow>
            )}
            {today.practiceStudents.length > 0 && (
              <ActionRow
                to="/worksheets"
                icon={ClipboardList}
                tone="lilac"
                title={t(language, "home.actionsPractice", {
                  n: today.practiceStudents.length,
                  s: today.practiceStudents.length === 1 ? "" : "s",
                })}
              >
                <StudentChips
                  items={today.practiceStudents.map((s) => ({
                    label: firstName(s),
                    to: `/students/${s.id}`,
                  }))}
                />
              </ActionRow>
            )}
            {today.group && (() => {
              const type = getGapType(today.group.gapTypeId);
              return (
                <ActionRow
                  to="/class"
                  icon={Users2}
                  tone="coral"
                  title={t(language, "home.actionsGroup")}
                >
                  {type ? (
                    <span className="block text-sm text-muted-foreground">
                      {t(language, "home.groupStudents", {
                        n: today.group.studentCount,
                        label: localizedGapType(type, language).label,
                      })}
                    </span>
                  ) : null}
                </ActionRow>
              );
            })()}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <CalendarCheck2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-heading text-base font-bold text-foreground">{t(language, "home.rotation")}</p>
              <p className="text-sm text-muted-foreground">
                {t(language, "home.heard", { done: rotation.assessedCount, total: rotation.total })}
              </p>
            </div>
          </div>
          <span className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary">
            {rotation.percent}%
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${rotation.percent}%` }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {rotation.remaining === 0
            ? t(language, "home.rotationDone")
            : t(language, "home.aboutRotation", {
                perDay: rotation.studentsPerDay,
                days: rotation.schoolDaysLeft,
                s: rotation.schoolDaysLeft === 1 ? "" : "s",
              })}
        </p>
        {nextUp.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(language, "home.nextUp")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nextUp.map((s) => {
                const gap = readyGapByStudent.get(s.id);
                return (
                  <Link
                    key={s.id}
                    to={
                      gap
                        ? `/assess?student=${s.id}&subject=${gap.subject}&gap=${gap.id}`
                        : `/assess?student=${s.id}`
                    }
                    className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary"
                  >
                    {firstName(s)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {due.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-secondary" strokeWidth={2.2} />
            <h2 className="font-heading text-lg font-bold">{t(language, "home.due")}</h2>
          </div>
          {due.map((g) => {
            const student = students.find((s) => s.id === g.studentId);
            const type = getGapType(g.gapTypeId);
            if (!student || !type) return null;
            return (
              <Link
                key={g.id}
                to={`/assess?student=${student.id}&subject=${g.subject}&gap=${g.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <StudentAvatar name={student.name} tint={student.avatarTint} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{localizedGapType(type, language).label}</p>
                </div>
                <StatusBadge urgency={urgencyForGap(g)} />
              </Link>
            );
          })}
        </section>
      )}

      <section className="space-y-3">          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-secondary" strokeWidth={2.2} />
              <h2 className="font-heading text-lg font-bold">{t(language, "home.smallGroups")}</h2>
            </div>
            <Link to="/class" className="text-sm font-semibold text-primary">
              {t(language, "home.classWall")}
            </Link>
          </div>
          {suggested.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              {t(language, "home.noGroups")}
            </div>
          ) : (
          suggested.map((g) => (
            <div key={g.gapTypeId} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="font-heading text-[15px] font-bold">{g.title}</p>
              <p className="text-sm text-muted-foreground">{g.reason}</p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">{t(language, "home.yourStudents")}</h2>
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link to="/students/new">
              <Plus className="h-4 w-4" />
              {t(language, "home.add")}
            </Link>
          </Button>
        </div>
        {roster.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            {t(language, "home.addFirst")}
          </p>
        ) : (
          [1, 2, 3].map((grade) => {
            const inGrade = roster.filter((s) => s.grade === grade);
            if (inGrade.length === 0) return null;
            const gradeDue = gaps.filter(
              (g) =>
                g.status === "active" &&
                inGrade.some((s) => s.id === g.studentId) &&
                new Date(g.reassessmentDueAt).getTime() <= Date.now(),
            ).length;
            return (
              <div key={grade} className="space-y-2.5">
                <Link
                  to={`/class/grade/${grade}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-accent/70 px-4 py-2.5"
                >
                  <span className="font-heading text-base font-bold text-primary">
                    {t(language, "class.grade", { grade })}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {t(language, "class.students", { n: inGrade.length })}
                    {gradeDue > 0 ? ` · ${t(language, "class.due", { n: gradeDue })}` : ""}
                  </span>
                </Link>
                {inGrade.map((student) => {
                  const open = gaps.filter((g) => g.studentId === student.id && g.status === "active");
                  const top = open.sort(
                    (a, b) => urgencyRank(urgencyForGap(a)) - urgencyRank(urgencyForGap(b)),
                  )[0];
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft"
                    >
                      <Link to={`/students/${student.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <StudentAvatar name={student.name} tint={student.avatarTint} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-[15px] font-bold">{student.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {t(language, "home.gradeRoll", { grade: student.grade, roll: student.rollNo })}
                            {!student.lastAssessedAt ? ` · ${t(language, "home.notAssessed")}` : ""}
                          </p>
                          {top && (
                            <div className="mt-1.5">
                              <StatusBadge urgency={urgencyForGap(top)} />
                            </div>
                          )}
                        </div>
                      </Link>
                      <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-full">
                        <Link to={`/assess?student=${student.id}`}>{t(language, "home.assess")}</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function urgencyRank(u: ReturnType<typeof urgencyForGap>) {
  return { persistent: 0, watch: 1, new: 2 }[u];
}

function ActionRow({
  to,
  icon: Icon,
  tone,
  title,
  children,
}: {
  to: string;
  icon: LucideIcon;
  tone: "primary" | "attention" | "lilac" | "coral";
  title: string;
  children?: React.ReactNode;
}) {
  const tile =
    tone === "primary"
      ? "bg-primary/12 text-primary"
      : tone === "attention"
        ? "bg-status-attention/20 text-status-attention-foreground"
        : tone === "lilac"
          ? "bg-secondary/15 text-secondary"
          : "bg-status-priority/15 text-status-priority-foreground";
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tile}`}>
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[15px] font-bold">{title}</span>
        {children}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function StudentChips({ items }: { items: { label: string; to: string }[] }) {
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary"
        >
          {it.label}
        </Link>
      ))}
    </span>
  );
}
