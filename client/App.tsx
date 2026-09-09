import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { AppProvider } from "@/state/AppProvider";
import Index from "./pages/Index";
import Assess from "./pages/Assess";
import Worksheets from "./pages/Worksheets";
import WorksheetDetail from "./pages/WorksheetDetail";
import Sync from "./pages/Sync";
import ClassOverview from "./pages/ClassOverview";
import ClassGrade from "./pages/ClassGrade";
import StudentDetail from "./pages/StudentDetail";
import StudentForm from "./pages/StudentForm";
import NotFound from "./pages/NotFound";

import CentralPortal from "./pages/portal/CentralPortal";

const queryClient = new QueryClient();

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

            {/* Mobile App Experience under /mobile and /app */}
            <Route
              path="/mobile"
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              }
            />
            <Route
              path="/mobile/*"
              element={
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
              }
            />
            <Route
              path="/app/*"
              element={
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
              }
            />

            {/* Direct Mobile Feature URLs */}
            <Route
              path="/class"
              element={
                <AppLayout>
                  <ClassOverview />
                </AppLayout>
              }
            />
            <Route
              path="/class/grade/:grade"
              element={
                <AppLayout>
                  <ClassGrade />
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
              path="/worksheets"
              element={
                <AppLayout>
                  <Worksheets />
                </AppLayout>
              }
            />
            <Route
              path="/worksheets/:id"
              element={
                <AppLayout>
                  <WorksheetDetail />
                </AppLayout>
              }
            />
            <Route
              path="/students/new"
              element={
                <AppLayout>
                  <StudentForm />
                </AppLayout>
              }
            />
            <Route
              path="/students/:id"
              element={
                <AppLayout>
                  <StudentDetail />
                </AppLayout>
              }
            />
            <Route
              path="/students/:id/edit"
              element={
                <AppLayout>
                  <StudentForm />
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
