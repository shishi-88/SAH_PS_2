import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { AppProvider, useApp } from "@/state/AppProvider";
import { t } from "@/lib/i18n";
import Index from "./pages/Index";
import Assess from "./pages/Assess";
import Worksheets from "./pages/Worksheets";
import WorksheetDetail from "./pages/WorksheetDetail";
import Sync from "./pages/Sync";
import ClassOverview from "./pages/ClassOverview";
import ClassGrade from "./pages/ClassGrade";
import StudentDetail from "./pages/StudentDetail";
import StudentForm from "./pages/StudentForm";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";

import CentralPortal from "./pages/portal/CentralPortal";

const queryClient = new QueryClient();

/**
 * Teacher session gate: first-time users land on setup; returning teachers
 * on the same trusted device go straight to the dashboard.
 */
function MobileAppRoutes() {
  const { phase, language } = useApp();
  if (phase === "loading") {
    return <p className="py-16 text-center text-muted-foreground">{t(language, "home.opening")}</p>;
  }
  if (phase === "setup") {
    return <Setup />;
  }
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/class" element={<ClassOverview />} />
        <Route path="/class/grade/:grade" element={<ClassGrade />} />
        <Route path="/assess" element={<Assess />} />
        <Route path="/worksheets" element={<Worksheets />} />
        <Route path="/worksheets/:id" element={<WorksheetDetail />} />
        <Route path="/students/new" element={<StudentForm />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/students/:id/edit" element={<StudentForm />} />
        <Route path="/sync" element={<Sync />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Primary Central Web Portal Dashboard (Default for Web App & Vercel Root) */}
            <Route path="/" element={<CentralPortal />} />
            <Route path="/portal" element={<CentralPortal />} />
            <Route path="/dashboard" element={<CentralPortal />} />
            <Route path="/analytics" element={<CentralPortal />} />
            <Route path="/admin" element={<CentralPortal />} />
            <Route path="/reports" element={<CentralPortal />} />
            <Route path="/roster" element={<CentralPortal />} />

            {/* Teacher Mobile App Experience */}
            <Route path="/mobile/*" element={<MobileAppRoutes />} />
            <Route path="/mobile" element={<MobileAppRoutes />} />
            <Route path="/app/*" element={<MobileAppRoutes />} />
            <Route path="/app" element={<MobileAppRoutes />} />

            {/* Direct Mobile Feature URLs */}
            <Route
              path="/class/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<ClassOverview />} />
                    <Route path="/grade/:grade" element={<ClassGrade />} />
                  </Routes>
                </AppLayout>
              }
            />
            <Route
              path="/assess"
              element={
                <AppLayout>
                  <Assess />
                </AppLayout>
              }
            />
            <Route
              path="/worksheets/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Worksheets />} />
                    <Route path="/:id" element={<WorksheetDetail />} />
                  </Routes>
                </AppLayout>
              }
            />
            <Route
              path="/students/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/new" element={<StudentForm />} />
                    <Route path="/:id" element={<StudentDetail />} />
                    <Route path="/:id/edit" element={<StudentForm />} />
                  </Routes>
                </AppLayout>
              }
            />
            <Route
              path="/sync"
              element={
                <AppLayout>
                  <Sync />
                </AppLayout>
              }
            />
            <Route path="/setup" element={<Setup />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.update();
      })
      .catch(() => {
        /* offline shell is optional in some hosts */
      });
  });
}
