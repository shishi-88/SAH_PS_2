import { Link, useLocation } from "react-router-dom";
import { Ear, House, ClipboardList, RefreshCw, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/worksheets", label: "Worksheets", icon: ClipboardList },
  { to: "/assess", label: "Assess", icon: Mic, primary: true },
  { to: "/sync", label: "Sync", icon: RefreshCw },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Ear className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-heading text-xl font-bold tracking-wide text-foreground">
              ListenRight
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-status-ontrack" />
            Working offline · saved on this phone
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-24">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur">
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
                      "-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background shadow-card transition-colors",
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
                    "h-5.5 w-5.5 h-[22px] w-[22px]",
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
