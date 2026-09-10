import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
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
 * Teacher session gate and layout shell: first-time users land on Setup/Login;
 * authenticated teachers access the full mobile experience with proper sub-routing.
 */
function MobileLayout() {
  const { phase, language } = useApp();
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          {t(language, "home.opening")}
        </p>
      </div>
    );
  }
  if (phase === "setup") {
    return <Setup />;
  }
  return (
    <AppLayout>
      <Outlet />
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
            {/* Primary Central Web Portal Multi-Page Routes */}
            <Route path="/" element={<CentralPortal />} />
            <Route path="/portal" element={<CentralPortal />} />
            <Route path="/portal/:tab" element={<CentralPortal />} />
            <Route path="/portal/:tab/:subId" element={<CentralPortal />} />
            <Route path="/dashboard" element={<CentralPortal />} />
            <Route path="/analytics" element={<CentralPortal />} />
            <Route path="/admin" element={<CentralPortal />} />
            <Route path="/reports" element={<CentralPortal />} />
            <Route path="/roster" element={<CentralPortal />} />

            {/* Direct Setup / Login routes */}
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Setup />} />

            {/* Teacher Mobile App Experience (with Session Gate & Child Routing) */}
            <Route element={<MobileLayout />}>
              <Route path="/mobile" element={<Index />} />
              <Route path="/mobile/class" element={<ClassOverview />} />
              <Route path="/mobile/class/grade/:grade" element={<ClassGrade />} />
              <Route path="/mobile/assess" element={<Assess />} />
              <Route path="/mobile/worksheets" element={<Worksheets />} />
              <Route path="/mobile/worksheets/:id" element={<WorksheetDetail />} />
              <Route path="/mobile/students/new" element={<StudentForm />} />
              <Route path="/mobile/students/:id" element={<StudentDetail />} />
              <Route path="/mobile/students/:id/edit" element={<StudentForm />} />
              <Route path="/mobile/sync" element={<Sync />} />

              {/* Direct feature routes used by AppLayout & mobile links */}
              <Route path="/app" element={<Index />} />
              <Route path="/class" element={<ClassOverview />} />
              <Route path="/class/grade/:grade" element={<ClassGrade />} />
              <Route path="/assess" element={<Assess />} />
              <Route path="/worksheets" element={<Worksheets />} />
              <Route path="/worksheets/:id" element={<WorksheetDetail />} />
              <Route path="/students/new" element={<StudentForm />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/students/:id/edit" element={<StudentForm />} />
              <Route path="/sync" element={<Sync />} />
            </Route>

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
