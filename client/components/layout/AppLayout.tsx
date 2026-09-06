import { Link, useLocation } from "react-router-dom";
import { BookOpen, House, ClipboardList, RefreshCw, Mic, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/class", label: "Class", icon: Users },
  { to: "/assess", label: "Assess", icon: Mic, primary: true },
  { to: "/worksheets", label: "Sheets", icon: ClipboardList },
  { to: "/sync", label: "Sync", icon: RefreshCw },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const printHide = location.pathname.startsWith("/worksheets/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={cn("sticky top-0 z-30 border-b border-border bg-background", printHide && "print:hidden")}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <BookOpen className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-heading text-xl font-bold tracking-wide text-foreground">
              Sahayak
            </span>
          </Link>
          <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline">
            Works offline · saved on this phone
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-24 print:max-w-none print:px-0 print:pb-0 print:pt-0">
        {children}
      </main>

      <nav className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card", printHide && "print:hidden")}>
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
          {navItems.map(({ to, label, icon: Icon, primary }) => {
            const active =
              location.pathname === to ||
              (to !== "/" && location.pathname.startsWith(to));
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
