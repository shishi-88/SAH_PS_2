import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  School,
  Sparkles,
  WifiOff,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/AppProvider";
import { t } from "@/lib/i18n";

export default function Setup() {
  const navigate = useNavigate();
  const { language, completeSetup, ready } = useApp();
  const [teacherName, setTeacherName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [busy, setBusy] = useState(false);
  const [offlineNote, setOfflineNote] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          {t(language, "setup.loading")}
        </p>
      </div>
    );
  }

  const handleLogin = async (teacher: string, pass: string, school?: string) => {
    if (!teacher.trim()) {
      setErrorMessage(
        language === "hi"
          ? "कृपया शिक्षक का नाम या लॉगिन आईडी दर्ज करें"
          : "Please enter your teacher name or login ID",
      );
      return;
    }
    if (!pass.trim()) {
      setErrorMessage(
        language === "hi"
          ? "कृपया पासवर्ड दर्ज करें"
          : "Please enter your password",
      );
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      await completeSetup({
        teacherName: teacher.trim(),
        password: pass.trim(),
        schoolName: school?.trim() || undefined,
      });
      navigate("/mobile");
    } catch (err: any) {
      if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setOfflineNote(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDemoLogin = async () => {
    setTeacherName("Prerna Sharma");
    setPassword("teacher123");
    setSchoolName("GPS-104 Primary School");
    await handleLogin("Prerna Sharma", "teacher123", "GPS-104 Primary School");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Header Link to Web Portal */}
      <header className="border-b border-border/60 px-5 py-3.5 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpen className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="font-heading font-bold text-base tracking-tight text-foreground">
            Sahayak Mobile
          </span>
        </div>
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
          <span>{language === "hi" ? "वेब पोर्टल खोलें" : "Open Web Portal"}</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-8 sm:px-6">
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-md shadow-primary/25 ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {t(language, "setup.title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t(language, "setup.subtitle")}
              </p>
            </div>
          </div>

          {/* Quick Demo Login Option */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {t(language, "setup.demoLogin")}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Prerna Sharma · GPS-104 (FLN Primary)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoLogin}
              disabled={busy}
              className="h-8 rounded-full text-xs font-semibold px-3 bg-card hover:bg-primary hover:text-primary-foreground border-primary/30 shrink-0"
            >
              1-Click Login
            </Button>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
              {errorMessage}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(teacherName, password, schoolName);
            }}
          >
            {/* Teacher Username / Login ID */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {t(language, "setup.teacherName")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="h-4 w-4" />
                </span>
                <input
                  required
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-3 text-sm font-normal focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder={t(language, "setup.teacherPlaceholder")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {t(language, "setup.password")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-10 text-sm font-normal focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(language, "setup.passwordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* School Name / District (Optional) */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t(language, "setup.schoolName")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <School className="h-4 w-4" />
                </span>
                <input
                  className="h-11 w-full rounded-2xl border border-border/80 bg-background pl-10 pr-3 text-sm font-normal focus:border-primary focus:outline-hidden transition-all"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={t(language, "setup.schoolPlaceholder")}
                />
              </div>
            </div>

            <Button
              className="w-full rounded-full mt-2 h-12 text-sm font-semibold bg-primary hover:bg-primary/90 shadow-md gap-2"
              size="lg"
              disabled={busy}
            >
              {busy ? (
                t(language, "setup.saving")
              ) : (
                <>
                  <span>{t(language, "setup.continue")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              {t(language, "setup.once")}
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0 text-secondary" />
              {t(language, "setup.returns")}
            </p>
            {offlineNote ? (
              <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
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

      {/* Footer */}
      <footer className="border-t border-border/50 py-3 text-center text-xs text-muted-foreground">
        NIPUN Bharat Aligned · Sahayak Field Teacher Experience
      </footer>
    </div>
  );
}