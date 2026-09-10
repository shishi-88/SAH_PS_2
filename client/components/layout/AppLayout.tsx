import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  House,
  ClipboardList,
  RefreshCw,
  Mic,
  Users,
  LayoutDashboard,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useApp } from "@/state/AppProvider";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  primary?: boolean;
}

const navItems: NavItem[] = [
  { to: "/mobile", labelKey: "nav.home", icon: House },
  { to: "/class", labelKey: "nav.class", icon: Users },
  { to: "/assess", labelKey: "nav.assess", icon: Mic, primary: true },
  { to: "/worksheets", labelKey: "nav.sheets", icon: ClipboardList },
  { to: "/sync", labelKey: "nav.sync", icon: RefreshCw },
];

function LangButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-1 text-xs font-bold leading-none",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, session, snapshot, switchTeacher } = useApp();
  const printHide = location.pathname.startsWith("/worksheets/");

  const teacherName = session?.teacherName || snapshot.classroom.teacherLabel || "Teacher";

  const handleSwitchTeacher = async () => {
    await switchTeacher();
    navigate("/mobile/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={cn("sticky top-0 z-30 border-b border-border bg-background", printHide && "print:hidden")}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3.5 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link to="/mobile" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold tracking-wide text-foreground">
                Sahayak
              </span>
            </Link>

            {/* Active Teacher Badge + Switch Trigger */}
            <div className="flex items-center gap-1 rounded-full border border-border/80 bg-card py-1 pl-1.5 pr-2 shadow-2xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {teacherName.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-foreground max-w-[70px] sm:max-w-[120px] truncate" title={teacherName}>
                {teacherName}
              </span>
              <button
                type="button"
                onClick={handleSwitchTeacher}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors ml-0.5"
                title={t(language, "header.switchTeacher")}
              >
                <ArrowLeftRight className="h-3 w-3" />
                <span className="hidden sm:inline">{t(language, "header.switchTeacher")}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-2xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "वेब पोर्टल" : "Web Portal"}</span>
            </Link>
            <div
              role="group"
              aria-label={t(language, "header.language")}
              className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
            >
              <LangButton active={language === "en"} onClick={() => setLanguage("en")}>
                EN
              </LangButton>
              <LangButton active={language === "hi"} onClick={() => setLanguage("hi")}>
                हिंदी
              </LangButton>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-24 print:max-w-none print:px-0 print:pb-0 print:pt-0">
        {children}
      </main>

      <nav className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card", printHide && "print:hidden")}>
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
          {navItems.map(({ to, labelKey, icon: Icon, primary }) => {
            const label = t(language, labelKey);
            const active =
              location.pathname === to ||
              (to !== "/mobile" && location.pathname.startsWith(to)) ||
              (to === "/mobile" && (location.pathname === "/mobile" || location.pathname === "/app"));
            if (primary) {
              return (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-1 flex-col items-center justify-end gap-1 px-2"
                  aria-label={label}
                >
                  <span
                    className={cn(
                      "-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background shadow-card",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.3} />
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-center"
                aria-label={label}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                  strokeWidth={2.1}
                />
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
