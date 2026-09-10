import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Server,
  Database,
  Users,
  GraduationCap,
  Layers,
  Activity,
  RefreshCw,
  Search,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Smartphone,
  School,
  Sparkles,
  BookOpen,
  Calculator,
  Compass,
  AlertCircle,
  FolderSync,
  HelpCircle,
  Download,
  Printer,
  ChevronRight,
  Filter,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Check,
  FileSpreadsheet,
  FileText,
  UserCheck,
  Info,
  Calendar,
  Layers3,
  Flame,
  Plus,
  Edit2,
  Trash2,
  FileCheck2,
  ClipboardList,
  Eye,
  ArrowRight,
  Award,
  Sparkle,
  X,
  UserPlus,
  SlidersHorizontal,
  Upload,
  FileUp,
  FolderUp,
  FolderArchive,
  FolderDown,
  FileDown,
  LogOut,
  Lock,
  EyeOff,
} from "lucide-react";
import JSZip from "jszip";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import { formatShortDate, createId } from "@/domain/ids";
import type {
  ClassEntity,
  StudentEntity,
  AssessmentEntity,
  LearningGapEntity,
  SyncLogEntry,
} from "@shared/api";
import { getGapType, getAllGapTypes } from "@/domain/competency-registry";
import {
  WORKSHEET_TEMPLATES,
  selectWorksheetTemplate,
  nextTier,
} from "@/domain/worksheet-bank";
import { useApp } from "@/state/AppProvider";
import { loadSnapshot, saveSnapshot } from "@/data/storage";
import type {
  AvatarTint,
  Grade,
  Subject,
  WorksheetInstance,
  WorksheetTemplate,
  WorksheetTier,
} from "@/domain/types";

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
      className={`rounded-full px-2.5 py-1 text-xs font-bold leading-none transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

const CHART_COLORS = {
  primary: "#4f46e5",
  secondary: "#7c3aed",
  rose: "#e11d48",
  amber: "#d97706",
  emerald: "#059669",
  indigo: "#4338ca",
  teal: "#0d9488",
  coral: "#ea580c",
};

function CustomAnalyticsTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 px-3 py-2 rounded-xl shadow-lg text-xs space-y-1">
        <p className="font-bold text-foreground border-b border-border/40 pb-1">{label || payload[0]?.name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`entry-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function generateDefaultDemoDataset(): {
  classes: ClassEntity[];
  students: StudentEntity[];
  learningGaps: LearningGapEntity[];
  worksheets: WorksheetInstance[];
} {
  const now = new Date().toISOString();
  const c1: ClassEntity = {
    id: "cls_primary_1",
    teacherId: "tea_demo",
    name: "Class 1A — Early Steps (कक्षा 1)",
    gradeBand: "Class 1",
    studentsPerDay: 5,
    reassessmentDays: 14,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  const c2: ClassEntity = {
    id: "cls_primary_2",
    teacherId: "tea_demo",
    name: "Class 2A — Foundational Section (कक्षा 2)",
    gradeBand: "Class 2",
    studentsPerDay: 5,
    reassessmentDays: 14,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  const c3: ClassEntity = {
    id: "cls_primary_3",
    teacherId: "tea_demo",
    name: "Class 3A — Fluency & Numeracy (कक्षा 3)",
    gradeBand: "Class 3",
    studentsPerDay: 5,
    reassessmentDays: 14,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  const sampleStudents: Array<{
    id: string;
    classId: string;
    name: string;
    grade: Grade;
    rollNo: string;
    avatarTint: AvatarTint;
    gaps: Array<{
      gapTypeId: string;
      subject: "reading" | "numeracy";
      status: "active" | "resolved";
      tier?: WorksheetTier;
      daysAgo?: number;
    }>;
  }> = [
    {
      id: "stu_aarav",
      classId: "cls_primary_1",
      name: "Aarav Sharma (आरव)",
      grade: 1,
      rollNo: "01",
      avatarTint: "teal",
      gaps: [
        { gapTypeId: "letter-sound-bd", subject: "reading", status: "active", tier: 1, daysAgo: 24 },
        { gapTypeId: "num-count-1-10", subject: "numeracy", status: "active", tier: 1, daysAgo: 10 },
      ],
    },
    {
      id: "stu_diya",
      classId: "cls_primary_1",
      name: "Diya Patel (दीया)",
      grade: 1,
      rollNo: "02",
      avatarTint: "coral",
      gaps: [
        { gapTypeId: "short-vowel-cvc-a-i", subject: "reading", status: "active", tier: 1, daysAgo: 5 },
        { gapTypeId: "letter-sound-bd", subject: "reading", status: "resolved", tier: 1, daysAgo: 30 },
      ],
    },
    {
      id: "stu_ishaan",
      classId: "cls_primary_1",
      name: "Ishaan Verma (ईशान)",
      grade: 1,
      rollNo: "03",
      avatarTint: "yellow",
      gaps: [
        { gapTypeId: "num-count-1-10", subject: "numeracy", status: "active", tier: 2, daysAgo: 14 },
      ],
    },
    {
      id: "stu_sara",
      classId: "cls_primary_1",
      name: "Sara Khan (सारा)",
      grade: 1,
      rollNo: "04",
      avatarTint: "lilac",
      gaps: [
        { gapTypeId: "letter-sound-bd", subject: "reading", status: "active", tier: 2, daysAgo: 8 },
      ],
    },
    {
      id: "stu_vivaan",
      classId: "cls_primary_2",
      name: "Vivaan Gupta (विवान)",
      grade: 2,
      rollNo: "01",
      avatarTint: "sand",
      gaps: [
        { gapTypeId: "consonant-blend-bl-cl-st", subject: "reading", status: "active", tier: 1, daysAgo: 22 },
        { gapTypeId: "place-value-tens-ones-20", subject: "numeracy", status: "active", tier: 2, daysAgo: 12 },
      ],
    },
    {
      id: "stu_ananya",
      classId: "cls_primary_2",
      name: "Ananya Joshi (अनन्या)",
      grade: 2,
      rollNo: "02",
      avatarTint: "sage",
      gaps: [
        { gapTypeId: "place-value-tens-ones-20", subject: "numeracy", status: "active", tier: 1, daysAgo: 9 },
      ],
    },
    {
      id: "stu_kabir",
      classId: "cls_primary_2",
      name: "Kabir Singh (कबीर)",
      grade: 2,
      rollNo: "03",
      avatarTint: "teal",
      gaps: [
        { gapTypeId: "addition-single-digit-carry", subject: "numeracy", status: "active", tier: 1, daysAgo: 18 },
        { gapTypeId: "consonant-blend-bl-cl-st", subject: "reading", status: "resolved", tier: 1, daysAgo: 40 },
      ],
    },
    {
      id: "stu_fatima",
      classId: "cls_primary_2",
      name: "Fatima Bi (फातिमा)",
      grade: 2,
      rollNo: "04",
      avatarTint: "coral",
      gaps: [
        { gapTypeId: "addition-single-digit-carry", subject: "numeracy", status: "active", tier: 2, daysAgo: 6 },
      ],
    },
    {
      id: "stu_rohan",
      classId: "cls_primary_3",
      name: "Rohan Nair (रोहन)",
      grade: 3,
      rollNo: "01",
      avatarTint: "yellow",
      gaps: [
        { gapTypeId: "multiplication-single-digit", subject: "numeracy", status: "active", tier: 1, daysAgo: 15 },
        { gapTypeId: "vowel-digraph-ee-ea-oa", subject: "reading", status: "active", tier: 1, daysAgo: 25 },
      ],
    },
    {
      id: "stu_meera",
      classId: "cls_primary_3",
      name: "Meera Das (मीरा)",
      grade: 3,
      rollNo: "02",
      avatarTint: "lilac",
      gaps: [
        { gapTypeId: "place-value-hundreds-999", subject: "numeracy", status: "active", tier: 1, daysAgo: 11 },
      ],
    },
    {
      id: "stu_aditya",
      classId: "cls_primary_3",
      name: "Aditya Roy (आदित्य)",
      grade: 3,
      rollNo: "03",
      avatarTint: "sand",
      gaps: [
        { gapTypeId: "vowel-digraph-ee-ea-oa", subject: "reading", status: "resolved", tier: 2, daysAgo: 20 },
      ],
    },
    {
      id: "stu_pooja",
      classId: "cls_primary_3",
      name: "Pooja Hegde (पूजा)",
      grade: 3,
      rollNo: "04",
      avatarTint: "sage",
      gaps: [],
    },
  ];

  const students: StudentEntity[] = [];
  const learningGaps: LearningGapEntity[] = [];
  const worksheets: WorksheetInstance[] = [];

  sampleStudents.forEach((s) => {
    students.push({
      id: s.id,
      classId: s.classId,
      name: s.name,
      grade: s.grade,
      rollNo: s.rollNo,
      avatarTint: s.avatarTint,
      isArchived: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastAssessedAt: new Date(Date.now() - (s.gaps[0]?.daysAgo || 2) * 86400000).toISOString(),
    });

    s.gaps.forEach((g, idx) => {
      const gapId = `gap_${s.id}_${idx + 1}`;
      const firstDetectedAt = new Date(Date.now() - (g.daysAgo || 5) * 86400000).toISOString();
      const resolvedAt = g.status === "resolved" ? new Date(Date.now() - 2 * 86400000).toISOString() : null;
      const lastDetectedAt = firstDetectedAt;
      const reassessmentDueAt = new Date(Date.now() + 7 * 86400000).toISOString();

      learningGaps.push({
        id: gapId,
        studentId: s.id,
        gapTypeId: g.gapTypeId,
        subject: g.subject,
        status: g.status,
        firstDetectedAt,
        lastDetectedAt,
        resolvedAt,
        reassessmentDueAt,
        currentTier: (g.tier || 1) as WorksheetTier,
        worksheetIds: [`ws_${gapId}`],
        assessmentIds: [`asm_${s.id}`],
        version: 1,
        createdAt: firstDetectedAt,
        updatedAt: resolvedAt || firstDetectedAt,
      });

      if (g.status === "active") {
        const tpl = selectWorksheetTemplate(g.gapTypeId, s.grade, g.subject, g.tier || 1);
        if (tpl) {
          worksheets.push({
            id: `ws_${gapId}`,
            studentId: s.id,
            gapRecordId: gapId,
            templateId: tpl.id,
            assignedAt: firstDetectedAt,
            tier: (g.tier || 1) as WorksheetTier,
            status: "assigned",
            title: tpl.title,
            titleHi: tpl.titleHi,
            focus: tpl.focus,
            focusHi: tpl.focusHi,
            items: tpl.items,
            itemsHi: tpl.itemsHi,
          });
        }
      }
    });
  });

  return {
    classes: [c1, c2, c3],
    students,
    learningGaps,
    worksheets,
  };
}

type TabKey =
  | "overview"
  | "students"
  | "gaps"
  | "worksheets"
  | "interventionCircles"
  | "classes"
  | "analytics"
  | "syncLogs"
  | "reports"
  | "workflow";

const TAB_TO_SLUG: Record<TabKey, string> = {
  overview: "overview",
  students: "students",
  gaps: "gaps",
  worksheets: "worksheets",
  interventionCircles: "circles",
  classes: "classes",
  analytics: "analytics",
  syncLogs: "import",
  reports: "reports",
  workflow: "workflow",
};

function parseTabParam(rawTab?: string, pathname?: string): TabKey {
  if (!rawTab) {
    if (pathname === "/analytics") return "analytics";
    if (pathname === "/reports") return "reports";
    if (pathname === "/roster") return "students";
    return "overview";
  }
  const t = rawTab.toLowerCase();
  if (t === "overview" || t === "dashboard") return "overview";
  if (t === "students" || t === "pupils" || t === "roster") return "students";
  if (t === "worksheets" || t === "practice" || t === "bank") return "worksheets";
  if (t === "gaps" || t === "competencies" || t === "skills") return "gaps";
  if (t === "circles" || t === "interventioncircles" || t === "groups") return "interventionCircles";
  if (t === "classes" || t === "classrooms" || t === "grades") return "classes";
  if (t === "analytics" || t === "charts" || t === "metrics") return "analytics";
  if (t === "import" || t === "sync" || t === "synclogs" || t === "ingest") return "syncLogs";
  if (t === "reports" || t === "export" || t === "register") return "reports";
  if (t === "workflow" || t === "guide" || t === "how-it-works") return "workflow";
  return "overview";
}

export default function CentralPortal() {
  const { language, setLanguage, reloadDemo, snapshot } = useApp();
  const portalTokenRef = useRef<string | null>(null);
  const tokenPromiseRef = useRef<Promise<string | null> | null>(null);

  // Portal Authentication Gate State
  const [isPortalAuthenticated, setIsPortalAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sahayak_portal_auth") === "true";
    } catch {
      return false;
    }
  });
  const [portalUser, setPortalUser] = useState<{ username: string; role: string; schoolName?: string } | null>(() => {
    try {
      const saved = localStorage.getItem("sahayak_portal_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  const handlePortalLoginSubmit = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser !== undefined ? customUser : loginUsername.trim();
    const p = customPass !== undefined ? customPass : loginPassword;
    if (!u || !p) {
      setLoginError(language === "hi" ? "कृपया उपयोगकर्ता नाम और पासवर्ड दोनों दर्ज करें।" : "Please enter both username and password.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed. Please check credentials.");
        return;
      }
      portalTokenRef.current = data.data.sessionToken;
      const userObj = data.data.user || { username: u, role: "Central Admin" };
      setPortalUser(userObj);
      setIsPortalAuthenticated(true);
      try {
        localStorage.setItem("sahayak_portal_auth", "true");
        localStorage.setItem("sahayak_portal_user", JSON.stringify(userObj));
        if (data.data.sessionToken) {
          localStorage.setItem("sahayak_portal_token", data.data.sessionToken);
        }
      } catch {}
      showNotification(`Welcome, ${userObj.username} (${userObj.role})`, "success");
    } catch (err: any) {
      // Local fallback for offline mode
      const isSuperAdmin = (u.toLowerCase() === "admin" && p === "admin123") || (u.toLowerCase() === "nipun" && p === "sahayak123");
      const isTeacher = (u.toLowerCase() === "prerna sharma" && p === "teacher123");
      if (isSuperAdmin || isTeacher) {
        const userObj = {
          username: isSuperAdmin ? "Administrator" : "Prerna Sharma",
          role: isSuperAdmin ? "Central Admin" : "Teacher Lead",
          schoolName: "GPS-104 Central Hub"
        };
        setPortalUser(userObj);
        setIsPortalAuthenticated(true);
        try {
          localStorage.setItem("sahayak_portal_auth", "true");
          localStorage.setItem("sahayak_portal_user", JSON.stringify(userObj));
        } catch {}
        showNotification(`Welcome, ${userObj.username} (${userObj.role})`, "success");
      } else {
        setLoginError(err.message || "Failed to authenticate. Use demo: admin / admin123 or Prerna Sharma / teacher123");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePortalSignOut = () => {
    setIsPortalAuthenticated(false);
    setPortalUser(null);
    portalTokenRef.current = null;
    try {
      localStorage.removeItem("sahayak_portal_auth");
      localStorage.removeItem("sahayak_portal_user");
      localStorage.removeItem("sahayak_portal_token");
    } catch {}
    showNotification(language === "hi" ? "आप सुरक्षित रूप से लॉग आउट हो गए हैं।" : "You have been securely signed out.", "info");
  };

  // School-level admin session for the central portal. Kept in memory only;
  // teacher-scoped endpoints reject requests without a valid session.
  const ensurePortalToken = (): Promise<string | null> => {
    if (portalTokenRef.current) return Promise.resolve(portalTokenRef.current);
    if (!tokenPromiseRef.current) {
      tokenPromiseRef.current = (async () => {
        try {
          const res = await fetch("/api/auth/admin/session", { method: "POST" });
          if (!res.ok) return null;
          const d = await res.json();
          portalTokenRef.current = d.data?.sessionToken ?? null;
          return portalTokenRef.current;
        } catch {
          return null;
        }
      })();
    }
    return tokenPromiseRef.current;
  };

  const portalFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
    const token = await ensurePortalToken();
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.get("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(path, { ...init, headers });
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // Central Database entities (Pre-populated with rich FLN dataset and synchronized with localStorage)
  const initialDemo = useMemo(() => generateDefaultDemoDataset(), []);
  const [classes, setClasses] = useState<ClassEntity[]>(() => {
    try {
      const saved = localStorage.getItem("sahayak_portal_classes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDemo.classes;
  });
  const [students, setStudents] = useState<StudentEntity[]>(() => {
    try {
      const saved = localStorage.getItem("sahayak_portal_students");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDemo.students;
  });
  const [learningGaps, setLearningGaps] = useState<LearningGapEntity[]>(() => {
    try {
      const saved = localStorage.getItem("sahayak_portal_gaps");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDemo.learningGaps;
  });
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [allocatedWorksheets, setAllocatedWorksheets] = useState<WorksheetInstance[]>(() => {
    try {
      const saved = localStorage.getItem("sahayak_portal_worksheets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDemo.worksheets;
  });
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    engine: string;
    url?: string;
    remoteCounts?: Record<string, number>;
    localCounts?: Record<string, number>;
    error?: string;
  } | null>(null);

  // Filters & Search
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "gaps" | "ontrack">("all");
  const [gapSubjectFilter, setGapSubjectFilter] = useState<"all" | "reading" | "numeracy">("all");
  const [gapUrgencyFilter, setGapUrgencyFilter] = useState<"all" | "persistent" | "watch" | "new">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-page navigation hooks and state synchronized with URL routes
  const { tab: urlTab, subId: urlSubId } = useParams<{ tab?: string; subId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTabState] = useState<TabKey>(() => parseTabParam(urlTab, location.pathname));

  useEffect(() => {
    const resolved = parseTabParam(urlTab, location.pathname);
    setActiveTabState(resolved);
  }, [urlTab, location.pathname]);

  const setActiveTab = (newTab: TabKey) => {
    setActiveTabState(newTab);
    const slug = TAB_TO_SLUG[newTab] || "overview";
    const targetPath = newTab === "overview" ? "/portal" : `/portal/${slug}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Deep linking: If URL has student subId (e.g. /portal/students/stu_aarav), open dossier modal
  useEffect(() => {
    if (urlSubId && activeTab === "students" && students.length > 0) {
      const match = students.find((s) => s.id === urlSubId);
      if (match) {
        setSelectedStudentDetail(match);
      }
    }
  }, [urlSubId, activeTab, students]);

  // Interactive Modals & Drawers
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentEntity | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<"needs" | "sheets" | "history">("needs");
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentEntity | null>(null);
  const [isAssignGapOpen, setIsAssignGapOpen] = useState(false);
  const [previewWorksheet, setPreviewWorksheet] = useState<WorksheetInstance | null>(null);

  // Classroom Management Modal State
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassEntity | null>(null);
  const [classForm, setClassForm] = useState<{
    name: string;
    gradeBand: string;
    teacherLabel: string;
    studentsPerDay: number;
    reassessmentDays: number;
  }>({
    name: "",
    gradeBand: "Class 1",
    teacherLabel: "Prerna Sharma",
    studentsPerDay: 5,
    reassessmentDays: 14,
  });

  // New Student Form State
  const [studentForm, setStudentForm] = useState<{
    name: string;
    grade: Grade;
    rollNo: string;
    classId: string;
    avatarTint: AvatarTint;
  }>({
    name: "",
    grade: 1,
    rollNo: "",
    classId: "",
    avatarTint: "teal",
  });

  // Assign Gap Form State
  const [assignGapForm, setAssignGapForm] = useState<{
    studentId: string;
    gapTypeId: string;
    tier: WorksheetTier;
  }>({
    studentId: "",
    gapTypeId: "letter-sound-bd",
    tier: 1,
  });

  // Offline Data Import State
  const [importJsonText, setImportJsonText] = useState("");
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [parsedImportData, setParsedImportData] = useState<{
    format?: string;
    source?: string;
    teacher?: { id?: string; name?: string; schoolName?: string };
    classes: ClassEntity[];
    students: StudentEntity[];
    learningGaps: LearningGapEntity[];
    assessments?: AssessmentEntity[];
    worksheets: WorksheetInstance[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [lastSyncSummary, setLastSyncSummary] = useState<{
    time: string;
    addedStudents: number;
    updatedStudents: number;
    totalStudents: number;
    gapsCount: number;
    source: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("sahayak_portal_last_sync");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Worksheet Bank & Allocation State
  const [worksheetViewMode, setWorksheetViewMode] = useState<"allocations" | "templates" | "classes">("allocations");
  const [worksheetClassFilter, setWorksheetClassFilter] = useState<string>("all");
  const [worksheetGradeFilter, setWorksheetGradeFilter] = useState<string>("all");
  const [worksheetStatusFilter, setWorksheetStatusFilter] = useState<"all" | "assigned" | "practiced">("all");
  const [worksheetSearchQuery, setWorksheetSearchQuery] = useState("");
  const [isAllocateWorksheetModalOpen, setIsAllocateWorksheetModalOpen] = useState(false);
  const [allocateModalStudentId, setAllocateModalStudentId] = useState<string>("");
  const [allocateModalTemplateId, setAllocateModalTemplateId] = useState<string>("");
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  const showNotification = (text: string, type: "success" | "info" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  // Fetch central database records from backend REST API or fallback to rich local state
  const fetchCentralData = async () => {
    try {
      setRefreshing(true);
      const [classRes, studentRes, gapRes, logRes, sbRes] = await Promise.all([
        portalFetch("/api/classes").catch(() => null),
        portalFetch("/api/students").catch(() => null),
        portalFetch("/api/learning-gaps").catch(() => null),
        portalFetch("/api/sync/logs").catch(() => null),
        portalFetch("/api/supabase/status").catch(() => null),
      ]);

      let loadedClasses: ClassEntity[] = [];
      let loadedStudents: StudentEntity[] = [];
      let loadedGaps: LearningGapEntity[] = [];

      if (classRes && classRes.ok) {
        const d = await classRes.json();
        loadedClasses = d.data || [];
      }
      if (studentRes && studentRes.ok) {
        const d = await studentRes.json();
        loadedStudents = d.data || [];
      }
      if (gapRes && gapRes.ok) {
        const d = await gapRes.json();
        loadedGaps = d.data || [];
      }
      if (logRes && logRes.ok) {
        const d = await logRes.json();
        setSyncLogs(d.data || []);
      }
      if (sbRes && sbRes.ok) {
        const sb = await sbRes.json();
        setSupabaseStatus(sb);
      }

      // If server returned empty or is offline/static, use default rich demo dataset
      if (loadedClasses.length === 0 || loadedStudents.length === 0) {
        const demo = generateDefaultDemoDataset();
        setClasses(demo.classes);
        setStudents(demo.students);
        setLearningGaps(demo.learningGaps);
        setAllocatedWorksheets(demo.worksheets);
      } else {
        setClasses(loadedClasses);
        setStudents(loadedStudents);
        setLearningGaps(loadedGaps);
      }
    } catch (e) {
      console.error("Failed to fetch central data, using local demo fallback:", e);
      const demo = generateDefaultDemoDataset();
      setClasses(demo.classes);
      setStudents(demo.students);
      setLearningGaps(demo.learningGaps);
      setAllocatedWorksheets(demo.worksheets);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      const demo = generateDefaultDemoDataset();

      // Immediately populate state so UI updates instantly
      setClasses(demo.classes);
      setStudents(demo.students);
      setLearningGaps(demo.learningGaps);
      setAllocatedWorksheets(demo.worksheets);
      setSelectedClassId("all");
      setSelectedGradeFilter("all");
      setSelectedStatusFilter("all");
      setSearchQuery("");

      // Immediately persist to localStorage
      try {
        localStorage.setItem("sahayak_portal_classes", JSON.stringify(demo.classes));
        localStorage.setItem("sahayak_portal_students", JSON.stringify(demo.students));
        localStorage.setItem("sahayak_portal_gaps", JSON.stringify(demo.learningGaps));
        localStorage.setItem("sahayak_portal_worksheets", JSON.stringify(demo.worksheets));
      } catch {}

      // Background triggers for server & local IndexedDB
      try {
        await portalFetch("/api/demo/seed", { method: "POST" });
      } catch (err) {
        console.warn("Server demo seed info:", err);
      }

      try {
        await reloadDemo();
      } catch (err) {
        console.warn("IndexedDB reloadDemo info:", err);
      }

      showNotification(
        language === "hi"
          ? "कक्षा 1–3 का बुनियादी साक्षरता और संख्यात्मकता डेमो डेटा लोड हो गया!"
          : "Realistic FLN Class 1–3 demo dataset successfully loaded!"
      );
    } catch (err) {
      console.error("Failed to seed demo data:", err);
      showNotification("Failed to seed demo data", "error");
    } finally {
      setSeeding(false);
    }
  };

  // Persist state to localStorage on updates for seamless reliability
  useEffect(() => {
    if (classes.length > 0) {
      try { localStorage.setItem("sahayak_portal_classes", JSON.stringify(classes)); } catch {}
    }
  }, [classes]);

  useEffect(() => {
    if (students.length > 0) {
      try { localStorage.setItem("sahayak_portal_students", JSON.stringify(students)); } catch {}
    }
  }, [students]);

  useEffect(() => {
    if (learningGaps.length > 0) {
      try { localStorage.setItem("sahayak_portal_gaps", JSON.stringify(learningGaps)); } catch {}
    }
  }, [learningGaps]);

  useEffect(() => {
    if (allocatedWorksheets.length > 0) {
      try { localStorage.setItem("sahayak_portal_worksheets", JSON.stringify(allocatedWorksheets)); } catch {}
    }
  }, [allocatedWorksheets]);

  // Sync snapshot worksheets with allocatedWorksheets on initial load
  useEffect(() => {
    fetchCentralData();
  }, []);

  useEffect(() => {
    if (snapshot.worksheets && snapshot.worksheets.length > 0) {
      setAllocatedWorksheets(snapshot.worksheets);
    }
  }, [snapshot.worksheets]);

  // Keep student modal updated if students or gaps change
  useEffect(() => {
    if (selectedStudentDetail) {
      const refreshed = students.find((s) => s.id === selectedStudentDetail.id);
      if (refreshed) {
        setSelectedStudentDetail(refreshed);
      }
    }
  }, [students]);

  // Filtered Students Roster
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = selectedClassId === "all" || s.classId === selectedClassId;
      const matchesGrade = selectedGradeFilter === "all" || String(s.grade) === selectedGradeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.includes(searchQuery);

      const activeGaps = learningGaps.filter((g) => g.studentId === s.id && g.status === "active");
      const matchesStatus =
        selectedStatusFilter === "all" ||
        (selectedStatusFilter === "gaps" && activeGaps.length > 0) ||
        (selectedStatusFilter === "ontrack" && activeGaps.length === 0);

      return matchesClass && matchesGrade && matchesSearch && matchesStatus;
    });
  }, [students, learningGaps, selectedClassId, selectedGradeFilter, selectedStatusFilter, searchQuery]);

  // Aggregate active learning gaps by competency gap type
  const aggregatedGaps = useMemo(() => {
    const gapTypeMap = new Map<
      string,
      {
        gapTypeId: string;
        label: string;
        labelHi?: string;
        subject: "reading" | "numeracy";
        urgency: "persistent" | "watch" | "new";
        grades: number[];
        mappingNote?: string;
        students: StudentEntity[];
      }
    >();

    learningGaps
      .filter((g) => g.status === "active")
      .forEach((g) => {
        const meta = getGapType(g.gapTypeId);
        const student = students.find((s) => s.id === g.studentId);
        if (!meta) return;

        let urgency: "persistent" | "watch" | "new" = "new";
        if (g.firstDetectedAt) {
          const diffDays = (Date.now() - new Date(g.firstDetectedAt).getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= 21) urgency = "persistent";
          else if (diffDays >= 7) urgency = "watch";
        }

        if (!gapTypeMap.has(g.gapTypeId)) {
          gapTypeMap.set(g.gapTypeId, {
            gapTypeId: g.gapTypeId,
            label: meta.label,
            labelHi: meta.labelHi,
            subject: meta.subject,
            urgency,
            grades: meta.grades,
            mappingNote: meta.mappingNote,
            students: student ? [student] : [],
          });
        } else if (student) {
          const existing = gapTypeMap.get(g.gapTypeId)!;
          if (!existing.students.some((s) => s.id === student.id)) {
            existing.students.push(student);
          }
        }
      });

    return Array.from(gapTypeMap.values()).filter((g) => {
      if (gapSubjectFilter !== "all" && g.subject !== gapSubjectFilter) return false;
      if (gapUrgencyFilter !== "all" && g.urgency !== gapUrgencyFilter) return false;
      if (selectedGradeFilter !== "all" && !g.grades.includes(Number(selectedGradeFilter))) return false;
      return true;
    });
  }, [learningGaps, students, gapSubjectFilter, gapUrgencyFilter, selectedGradeFilter]);

  // Key Counts
  const activeGapsCount = learningGaps.filter((g) => g.status === "active").length;
  const resolvedGapsCount = learningGaps.filter((g) => g.status === "resolved").length;
  const readingGapsCount = learningGaps.filter(
    (g) => g.status === "active" && g.subject === "reading"
  ).length;
  const numeracyGapsCount = learningGaps.filter(
    (g) => g.status === "active" && g.subject === "numeracy"
  ).length;
  const syncedCount = syncLogs.filter((l) => l.status === "SYNCED").length;

  // Visual Chart Data
  const subjectDistributionData = [
    {
      name: language === "hi" ? "पठन (Reading)" : "Reading (FLN)",
      value: readingGapsCount || 1,
      color: CHART_COLORS.rose,
    },
    {
      name: language === "hi" ? "संख्याज्ञान (Numeracy)" : "Numeracy (FLN)",
      value: numeracyGapsCount || 1,
      color: CHART_COLORS.amber,
    },
    {
      name: language === "hi" ? "समाधानित (Resolved)" : "Resolved Gaps",
      value: resolvedGapsCount || 1,
      color: CHART_COLORS.emerald,
    },
  ];

  const gradeBreakdownData = useMemo(() => {
    const grades = [1, 2, 3];
    return grades.map((gr) => {
      const gradeStudents = students.filter((s) => s.grade === gr).map((s) => s.id);
      const gradeReadingGaps = learningGaps.filter(
        (g) => g.status === "active" && g.subject === "reading" && gradeStudents.includes(g.studentId)
      ).length;
      const gradeNumeracyGaps = learningGaps.filter(
        (g) => g.status === "active" && g.subject === "numeracy" && gradeStudents.includes(g.studentId)
      ).length;
      const gradeResolved = learningGaps.filter(
        (g) => g.status === "resolved" && gradeStudents.includes(g.studentId)
      ).length;

      return {
        grade: `Class ${gr}`,
        Reading: gradeReadingGaps,
        Numeracy: gradeNumeracyGaps,
        Resolved: gradeResolved,
      };
    });
  }, [students, learningGaps]);

  const topCompetencyData = useMemo(() => {
    return aggregatedGaps
      .map((g) => ({
        name: g.label.length > 25 ? g.label.slice(0, 22) + "..." : g.label,
        count: g.students.length,
        subject: g.subject,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [aggregatedGaps]);

  // ==========================================
  // STUDENT MANAGEMENT HANDLERS (CRUD)
  // ==========================================

  const handleOpenCreateStudent = () => {
    const defaultClassId = classes[0]?.id || "cls_primary_1";
    setStudentForm({
      name: "",
      grade: 1,
      rollNo: String(students.length + 1).padStart(2, "0"),
      classId: defaultClassId,
      avatarTint: "teal",
    });
    setEditingStudent(null);
    setIsCreateStudentOpen(true);
  };

  const handleOpenEditStudent = (student: StudentEntity) => {
    setStudentForm({
      name: student.name,
      grade: student.grade as Grade,
      rollNo: student.rollNo,
      classId: student.classId,
      avatarTint: student.avatarTint as AvatarTint,
    });
    setEditingStudent(student);
    setIsCreateStudentOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.rollNo.trim()) {
      showNotification("Student name and roll number are required", "error");
      return;
    }

    try {
      const studentId = editingStudent ? editingStudent.id : createId("stu");
      const payload: Partial<StudentEntity> & { id: string; name: string } = {
        id: studentId,
        name: studentForm.name.trim(),
        grade: studentForm.grade,
        rollNo: studentForm.rollNo.trim(),
        classId: studentForm.classId || classes[0]?.id || "cls_primary_1",
        avatarTint: studentForm.avatarTint,
        updatedAt: new Date().toISOString(),
      };

      let savedEntity: StudentEntity = {
        id: studentId,
        classId: studentForm.classId || classes[0]?.id || "cls_primary_1",
        name: studentForm.name.trim(),
        grade: studentForm.grade,
        rollNo: studentForm.rollNo.trim(),
        avatarTint: studentForm.avatarTint,
        isArchived: false,
        version: editingStudent ? editingStudent.version + 1 : 1,
        createdAt: editingStudent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAssessedAt: editingStudent?.lastAssessedAt || null,
      };

      try {
        const res = await portalFetch("/api/students", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) savedEntity = data.data;
        }
      } catch (err) {
        console.warn("Backend student save warning (fallback to local state):", err);
      }

      if (editingStudent) {
        setStudents((prev) => prev.map((s) => (s.id === savedEntity.id ? savedEntity : s)));
        if (selectedStudentDetail?.id === savedEntity.id) {
          setSelectedStudentDetail(savedEntity);
        }
        showNotification(language === "hi" ? "विद्यार्थी प्रोफ़ाइल अपडेट की गई!" : "Student profile updated successfully!");
      } else {
        setStudents((prev) => [savedEntity, ...prev]);
        showNotification(language === "hi" ? "नया विद्यार्थी सफलतापूर्वक जोड़ा गया!" : "New student enrolled successfully!");
      }
      setIsCreateStudentOpen(false);
    } catch (err) {
      console.error("Failed to save student:", err);
      showNotification("Failed to save student record", "error");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm(language === "hi" ? "क्या आप वाकई इस विद्यार्थी का रिकॉर्ड हटाना चाहते हैं?" : "Are you sure you want to remove this student record?")) {
      return;
    }

    try {
      try {
        await portalFetch(`/api/students/${studentId}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Backend student delete warning:", e);
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setLearningGaps((prev) => prev.filter((g) => g.studentId !== studentId));
      setAllocatedWorksheets((prev) => prev.filter((w) => w.studentId !== studentId));
      if (selectedStudentDetail?.id === studentId) {
        setSelectedStudentDetail(null);
      }
      showNotification(language === "hi" ? "विद्यार्थी रिकॉर्ड हटाया गया" : "Student record removed");
    } catch (err) {
      console.error("Failed to delete student:", err);
      showNotification("Failed to delete student", "error");
    }
  };

  // ==========================================
  // CLASSROOM MANAGEMENT HANDLERS (CRUD)
  // ==========================================

  const handleOpenCreateClass = () => {
    setClassForm({
      name: "",
      gradeBand: "Class 1",
      teacherLabel: "Prerna Sharma",
      studentsPerDay: 5,
      reassessmentDays: 14,
    });
    setEditingClass(null);
    setIsCreateClassOpen(true);
  };

  const handleOpenEditClass = (cls: ClassEntity) => {
    setClassForm({
      name: cls.name,
      gradeBand: cls.gradeBand || "Class 1",
      teacherLabel: (cls as any).teacherLabel || "Prerna Sharma",
      studentsPerDay: cls.studentsPerDay || 5,
      reassessmentDays: cls.reassessmentDays || 14,
    });
    setEditingClass(cls);
    setIsCreateClassOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      showNotification("Classroom name is required", "error");
      return;
    }

    try {
      const classId = editingClass ? editingClass.id : createId("class");
      let savedClass: ClassEntity = {
        id: classId,
        teacherId: "tea_demo",
        name: classForm.name.trim(),
        gradeBand: classForm.gradeBand,
        studentsPerDay: classForm.studentsPerDay || 5,
        reassessmentDays: classForm.reassessmentDays || 14,
        version: editingClass ? editingClass.version + 1 : 1,
        createdAt: editingClass?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedClass),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) savedClass = data.data;
        }
      } catch (err) {
        console.warn("Backend class save warning (fallback to local state):", err);
      }

      if (editingClass) {
        setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, ...savedClass } : c)));
        showNotification(
          language === "hi"
            ? `कक्षा '${savedClass.name}' अपडेट हो गई!`
            : `Classroom '${savedClass.name}' updated successfully!`
        );
      } else {
        setClasses((prev) => [savedClass, ...prev]);
        showNotification(
          language === "hi"
            ? `नई कक्षा '${savedClass.name}' जुड़ गई!`
            : `Classroom '${savedClass.name}' created successfully!`
        );
      }

      setIsCreateClassOpen(false);
    } catch (err) {
      console.error("Failed to save class:", err);
      showNotification("Failed to save classroom", "error");
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (
      !confirm(
        language === "hi"
          ? `क्या आप वाकई कक्षा '${className}' को हटाना चाहते हैं?`
          : `Are you sure you want to remove classroom '${className}'?`
      )
    ) {
      return;
    }

    try {
      try {
        await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Backend class delete warning:", e);
      }

      setClasses((prev) => prev.filter((c) => c.id !== classId));
      showNotification(
        language === "hi"
          ? `कक्षा '${className}' हटा दी गई`
          : `Classroom '${className}' removed`
      );
    } catch (err) {
      console.error("Failed to delete class:", err);
      showNotification("Failed to delete classroom", "error");
    }
  };

  // ==========================================
  // LEARNING GAP & IMPROVEMENT NEEDS ACTIONS
  // ==========================================

  const handleOpenAssignGapModal = (student: StudentEntity) => {
    setAssignGapForm({
      studentId: student.id,
      gapTypeId: "letter-sound-bd",
      tier: 1,
    });
    setIsAssignGapOpen(true);
  };

  const handleAssignNewGap = async (e: React.FormEvent) => {
    e.preventDefault();
    const meta = getGapType(assignGapForm.gapTypeId);
    if (!meta) return;

    try {
      const gapId = createId("gap");
      const now = new Date().toISOString();
      const payload: Partial<LearningGapEntity> & { id: string; studentId: string; gapTypeId: string } = {
        id: gapId,
        studentId: assignGapForm.studentId,
        gapTypeId: assignGapForm.gapTypeId,
        subject: meta.subject,
        status: "active",
        currentTier: assignGapForm.tier,
        firstDetectedAt: now,
        lastDetectedAt: now,
        updatedAt: now,
      };

      const res = await portalFetch("/api/learning-gaps", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        const savedGap: LearningGapEntity = d.data;
        setLearningGaps((prev) => [savedGap, ...prev]);

        // Auto-allocate initial worksheet
        const targetStudent = students.find((s) => s.id === assignGapForm.studentId);
        if (targetStudent) {
          handleAllocateWorksheet(targetStudent, assignGapForm.gapTypeId, assignGapForm.tier, false);
        }

        setIsAssignGapOpen(false);
        showNotification(
          language === "hi"
            ? "नया सीखने का अंतराल दर्ज किया गया और अभ्यास पत्रक आबंटित किया गया!"
            : "Assigned learning gap & allocated targeted practice worksheet!"
        );
      }
    } catch (err) {
      console.error("Failed to assign gap:", err);
      showNotification("Failed to record learning gap", "error");
    }
  };

  const handleResolveGap = async (gapId: string) => {
    const existing = learningGaps.find((g) => g.id === gapId);
    if (!existing) return;

    try {
      const now = new Date().toISOString();
      const payload = {
        ...existing,
        status: "resolved" as const,
        resolvedAt: now,
        updatedAt: now,
      };

      const res = await portalFetch("/api/learning-gaps", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        setLearningGaps((prev) => prev.map((g) => (g.id === gapId ? d.data : g)));
        showNotification(
          language === "hi"
            ? "सीखने का अंतराल सफलतापूर्वक हल (Resolved) चिह्नित किया गया!"
            : "Learning gap marked resolved and remediated!"
        );
      }
    } catch (err) {
      console.error("Failed to resolve gap:", err);
      showNotification("Failed to resolve gap", "error");
    }
  };

  const handleEscalateTier = async (gap: LearningGapEntity) => {
    const nextT = nextTier((gap.currentTier || 1) as WorksheetTier);
    if (nextT === gap.currentTier) {
      showNotification("Student is already practicing at maximum Tier 3 fluency!", "info");
      return;
    }

    try {
      const now = new Date().toISOString();
      const payload = {
        ...gap,
        currentTier: nextT,
        updatedAt: now,
      };

      const res = await portalFetch("/api/learning-gaps", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        setLearningGaps((prev) => prev.map((g) => (g.id === gap.id ? d.data : g)));

        const targetStudent = students.find((s) => s.id === gap.studentId);
        if (targetStudent) {
          handleAllocateWorksheet(targetStudent, gap.gapTypeId, nextT, true);
        }
      }
    } catch (err) {
      console.error("Failed to escalate tier:", err);
    }
  };

  // ==========================================
  // PRACTICE SHEET ALLOCATION HANDLERS
  // ==========================================

  const handleAllocateWorksheet = (
    student: StudentEntity,
    gapTypeId: string,
    tier: WorksheetTier = 1,
    openPreview = true
  ) => {
    const meta = getGapType(gapTypeId);
    const subject = meta?.subject || "reading";
    const template = selectWorksheetTemplate(gapTypeId, student.grade as Grade, subject, tier);

    if (!template) {
      showNotification("No pre-built template found for this tier and grade combination", "info");
      return;
    }

    const newInstance: WorksheetInstance = {
      id: createId("ws"),
      studentId: student.id,
      gapRecordId: learningGaps.find((g) => g.studentId === student.id && g.gapTypeId === gapTypeId)?.id || "",
      templateId: template.id,
      assignedAt: new Date().toISOString(),
      tier,
      status: "assigned",
      title: language === "hi" && template.titleHi ? template.titleHi : template.title,
      focus: language === "hi" && template.focusHi ? template.focusHi : template.focus,
      items: language === "hi" && template.itemsHi ? template.itemsHi : template.items,
    };

    setAllocatedWorksheets((prev) => [newInstance, ...prev.filter((w) => w.id !== newInstance.id)]);

    if (openPreview) {
      setPreviewWorksheet(newInstance);
      showNotification(
        language === "hi"
          ? `${student.name} के लिए टियर ${tier} अभ्यास पत्रक आबंटित किया गया!`
          : `Allocated Tier ${tier} practice worksheet for ${student.name}!`
      );
    }
  };

  const handleMarkWorksheetPracticed = (worksheetId: string) => {
    setAllocatedWorksheets((prev) =>
      prev.map((w) =>
        w.id === worksheetId
          ? {
              ...w,
              status: w.status === "practiced" ? "assigned" : "practiced",
              practicedAt: w.status === "practiced" ? undefined : new Date().toISOString(),
            }
          : w
      )
    );
    showNotification("Worksheet practice status updated!");
  };

  const handleBatchAllocateGroupWorksheets = (group: { gapTypeId: string; students: StudentEntity[] }) => {
    let count = 0;
    group.students.forEach((s) => {
      const studentGap = learningGaps.find((g) => g.studentId === s.id && g.gapTypeId === group.gapTypeId);
      const tier = (studentGap?.currentTier || 1) as WorksheetTier;
      handleAllocateWorksheet(s, group.gapTypeId, tier, false);
      count++;
    });

    showNotification(
      language === "hi"
        ? `समूह के सभी ${count} विद्यार्थियों के लिए व्यक्तिगत अभ्यास पत्रक आबंटित किए गए!`
        : `Allocated personalized practice worksheets for all ${count} students in this group!`
    );
  };

  const handleRemoveAllocatedWorksheet = (worksheetId: string) => {
    setAllocatedWorksheets((prev) => prev.filter((w) => w.id !== worksheetId));
    showNotification(
      language === "hi" ? "अभ्यास पत्रक आबंटन हटाया गया" : "Worksheet allocation removed",
      "info"
    );
  };

  const handleOpenAllocateModal = (studentId?: string, templateId?: string) => {
    setAllocateModalStudentId(studentId || students[0]?.id || "");
    setAllocateModalTemplateId(templateId || WORKSHEET_TEMPLATES[0]?.id || "");
    setIsAllocateWorksheetModalOpen(true);
  };

  const handleConfirmAllocateFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students.find((s) => s.id === allocateModalStudentId);
    const targetTemplate = WORKSHEET_TEMPLATES.find((t) => t.id === allocateModalTemplateId);
    if (!targetStudent || !targetTemplate) {
      showNotification("Please select both a student and a worksheet template", "error");
      return;
    }

    handleAllocateWorksheet(targetStudent, targetTemplate.gapTypeId, targetTemplate.tier, true);
    setIsAllocateWorksheetModalOpen(false);
  };

  // Helper to generate a standalone, beautifully styled printable A4 HTML sheet
  const generateWorksheetHtml = (
    ws: WorksheetInstance,
    student?: StudentEntity,
    cls?: ClassEntity
  ): string => {
    const studentName = student?.name || "Pupil";
    const rollNo = student?.rollNo || "01";
    const className = cls?.name || `Class ${student?.grade || 1}`;
    const dateStr = formatShortDate(ws.assignedAt);
    const title = language === "hi" && ws.titleHi ? ws.titleHi : ws.title;
    const focus = language === "hi" && ws.focusHi ? ws.focusHi : ws.focus;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${studentName} - ${title} (Tier ${ws.tier})</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 20px;
  }
  .worksheet-card {
    border: 2px solid #0f172a;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-left h1 {
    font-size: 18px;
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.2px;
  }
  .header-left p {
    font-size: 11px;
    color: #475569;
    margin: 3px 0 0 0;
  }
  .tier-badge {
    border: 2px solid #0f172a;
    background: #f8fafc;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 800;
    font-family: monospace;
    border-radius: 4px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 2fr 1.2fr 1fr;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 16px 0;
    font-size: 11px;
  }
  .meta-label { color: #64748b; font-size: 9px; text-transform: uppercase; font-family: monospace; }
  .meta-val { font-weight: 700; color: #0f172a; font-size: 12px; margin-top: 1px; }
  .focus-box {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 10px 14px;
    margin-bottom: 18px;
    border-radius: 4px;
  }
  .focus-title { font-weight: 700; font-size: 13px; color: #1e3a8a; }
  .focus-desc { font-size: 11px; color: #1e40af; margin-top: 2px; }
  .items-list { display: flex; flex-direction: column; gap: 12px; }
  .item-row {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    background: #ffffff;
  }
  .item-prompt {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .item-num {
    background: #0f172a;
    color: #ffffff;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 11px;
    font-family: monospace;
    font-weight: 700;
    flex-shrink: 0;
  }
  .writing-area {
    margin-top: 14px;
    border-bottom: 1.5px dashed #94a3b8;
    height: 38px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 4px 4px 4px;
    font-size: 10px;
    color: #94a3b8;
    font-family: monospace;
  }
  .footer-grid {
    margin-top: 24px;
    border-top: 2px solid #0f172a;
    padding-top: 14px;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
    font-size: 10px;
    font-family: monospace;
  }
  .notes-line { border-bottom: 1px solid #cbd5e1; height: 24px; margin-top: 6px; }
  @media print {
    body { padding: 0; }
    .worksheet-card { border: none; padding: 0; }
  }
</style>
</head>
<body>
<div class="worksheet-card">
  <div class="header">
    <div class="header-left">
      <h1>सहायक (SAHAYAK) FLN PRACTICE WORKSHEET</h1>
      <p>Class 1–3 Foundational Literacy & Numeracy Skill Remediator</p>
    </div>
    <div class="tier-badge">TIER ${ws.tier} DRILL</div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-label">STUDENT NAME</div>
      <div class="meta-val">${studentName}</div>
    </div>
    <div>
      <div class="meta-label">CLASS / ROLL NO</div>
      <div class="meta-val">${className} · #${rollNo}</div>
    </div>
    <div>
      <div class="meta-label">DATE ALLOCATED</div>
      <div class="meta-val">${dateStr}</div>
    </div>
  </div>

  <div class="focus-box">
    <div class="focus-title">${title}</div>
    <div class="focus-desc">${focus}</div>
  </div>

  <div class="items-list">
    ${ws.items
      .map(
        (it, idx) => `
    <div class="item-row">
      <div class="item-prompt">
        <span class="item-num">${idx + 1}</span>
        <span>${language === "hi" && it.promptHi ? it.promptHi : it.prompt}</span>
      </div>
      <div class="writing-area">
        <span>Child Response / Tracing Area</span>
        <span>[ Teacher Check: ___ / 1 ]</span>
      </div>
    </div>`
      )
      .join("")}
  </div>

  <div class="footer-grid">
    <div>
      <div>TEACHER OBSERVATION & NOTES:</div>
      <div class="notes-line"></div>
    </div>
    <div>
      <div>OUTCOME VERIFICATION:</div>
      <div style="margin-top: 8px; display: flex; gap: 8px;">
        <span>[ ] Pass</span>
        <span>[ ] Advance</span>
        <span>[ ] Repeat</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
  };

  // Helper to generate a multi-page combined HTML document with page breaks for printing whole class
  const generateCombinedClassHtml = (
    classItem: ClassEntity,
    entries: Array<{ ws: WorksheetInstance; student: StudentEntity }>
  ): string => {
    const sheetsHtml = entries
      .map(({ ws, student }) => {
        const studentName = student.name;
        const rollNo = student.rollNo;
        const className = classItem.name;
        const dateStr = formatShortDate(ws.assignedAt);
        const title = language === "hi" && ws.titleHi ? ws.titleHi : ws.title;
        const focus = language === "hi" && ws.focusHi ? ws.focusHi : ws.focus;

        return `
<div class="worksheet-card page">
  <div class="header">
    <div class="header-left">
      <h1>सहायक (SAHAYAK) FLN PRACTICE WORKSHEET</h1>
      <p>Class 1–3 Foundational Literacy & Numeracy Skill Remediator</p>
    </div>
    <div class="tier-badge">TIER ${ws.tier} DRILL</div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-label">STUDENT NAME</div>
      <div class="meta-val">${studentName}</div>
    </div>
    <div>
      <div class="meta-label">CLASS / ROLL NO</div>
      <div class="meta-val">${className} · #${rollNo}</div>
    </div>
    <div>
      <div class="meta-label">DATE ALLOCATED</div>
      <div class="meta-val">${dateStr}</div>
    </div>
  </div>

  <div class="focus-box">
    <div class="focus-title">${title}</div>
    <div class="focus-desc">${focus}</div>
  </div>

  <div class="items-list">
    ${ws.items
      .map(
        (it, idx) => `
    <div class="item-row">
      <div class="item-prompt">
        <span class="item-num">${idx + 1}</span>
        <span>${language === "hi" && it.promptHi ? it.promptHi : it.prompt}</span>
      </div>
      <div class="writing-area">
        <span>Child Response / Tracing Area</span>
        <span>[ Teacher Check: ___ / 1 ]</span>
      </div>
    </div>`
      )
      .join("")}
  </div>

  <div class="footer-grid">
    <div>
      <div>TEACHER OBSERVATION & NOTES:</div>
      <div class="notes-line"></div>
    </div>
    <div>
      <div>OUTCOME VERIFICATION:</div>
      <div style="margin-top: 8px; display: flex; gap: 8px;">
        <span>[ ] Pass</span>
        <span>[ ] Advance</span>
        <span>[ ] Repeat</span>
      </div>
    </div>
  </div>
</div>
<div class="page-break"></div>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${classItem.name} - Complete Practice Worksheet Batch</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #e2e8f0;
    margin: 0;
    padding: 20px;
  }
  .page {
    background: #ffffff;
    border: 2px solid #0f172a;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto 30px auto;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-left h1 {
    font-size: 18px;
    margin: 0;
    font-weight: 800;
  }
  .header-left p {
    font-size: 11px;
    color: #475569;
    margin: 3px 0 0 0;
  }
  .tier-badge {
    border: 2px solid #0f172a;
    background: #f8fafc;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 800;
    font-family: monospace;
    border-radius: 4px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 2fr 1.2fr 1fr;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 16px 0;
    font-size: 11px;
  }
  .meta-label { color: #64748b; font-size: 9px; text-transform: uppercase; font-family: monospace; }
  .meta-val { font-weight: 700; color: #0f172a; font-size: 12px; }
  .focus-box {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 10px 14px;
    margin-bottom: 18px;
    border-radius: 4px;
  }
  .focus-title { font-weight: 700; font-size: 13px; color: #1e3a8a; }
  .focus-desc { font-size: 11px; color: #1e40af; margin-top: 2px; }
  .items-list { display: flex; flex-direction: column; gap: 12px; }
  .item-row {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    background: #ffffff;
  }
  .item-prompt {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .item-num {
    background: #0f172a;
    color: #ffffff;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 11px;
    font-family: monospace;
    font-weight: 700;
    flex-shrink: 0;
  }
  .writing-area {
    margin-top: 14px;
    border-bottom: 1.5px dashed #94a3b8;
    height: 38px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 4px 4px 4px;
    font-size: 10px;
    color: #94a3b8;
    font-family: monospace;
  }
  .footer-grid {
    margin-top: 24px;
    border-top: 2px solid #0f172a;
    padding-top: 14px;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
    font-size: 10px;
    font-family: monospace;
  }
  .notes-line { border-bottom: 1px solid #cbd5e1; height: 24px; margin-top: 6px; }
  .page-break { page-break-after: always; break-after: page; height: 0; }
  @media print {
    body { padding: 0; background: #ffffff; }
    .page { border: none; padding: 0; margin: 0; }
  }
</style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>`;
  };

  // Download all allocated practice sheets for a specific classroom as a complete ZIP package
  const handleDownloadClassWorksheetsZip = async (targetClassId: string) => {
    try {
      setIsGeneratingZip(true);
      const targetClass = classes.find((c) => c.id === targetClassId);
      const targetClassName = targetClass ? targetClass.name : "All_Classrooms";
      const cleanClassName = targetClassName.replace(/[^a-zA-Z0-9_-]/g, "_");

      // Filter students in the target class (or all students if 'all')
      const targetStudents =
        targetClassId === "all"
          ? students
          : students.filter((s) => s.classId === targetClassId);

      if (targetStudents.length === 0) {
        showNotification("No students found in the selected classroom.", "info");
        return;
      }

      // Collect all allocated worksheets for these students
      const studentMap = new Map(targetStudents.map((s) => [s.id, s]));
      const relevantWorksheets = allocatedWorksheets.filter((w) =>
        studentMap.has(w.studentId)
      );

      if (relevantWorksheets.length === 0) {
        showNotification(
          language === "hi"
            ? `कक्षा '${targetClassName}' के किसी भी विद्यार्थी के पास अभी आबंटित अभ्यास पत्रक नहीं हैं।`
            : `No practice worksheets are currently allocated for students in ${targetClassName}. Allocate some worksheets first!`,
          "info"
        );
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder(`Worksheets_${cleanClassName}`);

      const entries: Array<{ ws: WorksheetInstance; student: StudentEntity }> = [];

      relevantWorksheets.forEach((ws) => {
        const student = studentMap.get(ws.studentId)!;
        entries.push({ ws, student });
        const studentClass = classes.find((c) => c.id === student.classId);
        const html = generateWorksheetHtml(ws, student, studentClass);
        const cleanStudentName = student.name.replace(/[^a-zA-Z0-9_-]/g, "_");
        const cleanTitle = (ws.title || "Worksheet").replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `Roll${student.rollNo}_${cleanStudentName}_Tier${ws.tier}_${cleanTitle}.html`;
        folder?.file(filename, html);
      });

      // Also create a combined master HTML file for 1-click batch printing
      if (targetClass) {
        const combinedHtml = generateCombinedClassHtml(targetClass, entries);
        folder?.file(`00_ALL_${cleanClassName}_PRINT_BUNDLE.html`, combinedHtml);
      } else {
        const dummyClass: ClassEntity = {
          id: "all",
          name: "All Classrooms Batch",
          gradeBand: "Class 1-3",
          studentsPerDay: 5,
          reassessmentDays: 14,
          teacherId: "admin",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const combinedHtml = generateCombinedClassHtml(dummyClass, entries);
        folder?.file(`00_ALL_STUDENTS_PRINT_BUNDLE.html`, combinedHtml);
      }

      // Manifest text file
      let manifest = `=======================================================\n`;
      manifest += `SAHAYAK FLN PRACTICE WORKSHEET CLASS BUNDLE\n`;
      manifest += `Class: ${targetClassName}\n`;
      manifest += `Generated: ${new Date().toLocaleString()}\n`;
      manifest += `Total Allocated Sheets: ${relevantWorksheets.length}\n`;
      manifest += `Students Covered: ${new Set(relevantWorksheets.map((w) => w.studentId)).size} of ${targetStudents.length}\n`;
      manifest += `=======================================================\n\n`;
      manifest += `STUDENT ALLOCATION SUMMARY:\n`;
      entries.forEach(({ ws, student }, idx) => {
        manifest += `${idx + 1}. [Roll #${student.rollNo}] ${student.name} (Class ${student.grade}) - Tier ${ws.tier}: ${ws.title} (${ws.status})\n`;
      });
      manifest += `\nPRINTING INSTRUCTIONS:\n`;
      manifest += `1. Double-click '00_ALL_*_PRINT_BUNDLE.html' in your web browser and press Ctrl+P (or Cmd+P) to print all sheets at once.\n`;
      manifest += `2. Or open individual student .html files to inspect or print individually.\n`;
      folder?.file("CLASS_ALLOCATION_SUMMARY.txt", manifest);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sahayak_Worksheets_${cleanClassName}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(
        language === "hi"
          ? `${targetClassName} के लिए ${relevantWorksheets.length} अभ्यास पत्रकों की ZIP फ़ाइल डाउनलोड हो गई!`
          : `Downloaded ZIP containing ${relevantWorksheets.length} practice sheets for ${targetClassName}!`,
        "success"
      );
    } catch (err: any) {
      console.error("ZIP Generation error:", err);
      showNotification("Failed to generate ZIP archive: " + (err?.message || "Unknown error"), "error");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // 1-Click Print all allocated worksheets for a classroom
  const handlePrintClassWorksheets = (targetClassId: string) => {
    const targetClass = classes.find((c) => c.id === targetClassId) || {
      id: "all",
      name: "All Classrooms Batch",
      gradeBand: "Class 1-3",
      studentsPerDay: 5,
      reassessmentDays: 14,
      teacherId: "admin",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targetStudents =
      targetClassId === "all"
        ? students
        : students.filter((s) => s.classId === targetClassId);

    const studentMap = new Map(targetStudents.map((s) => [s.id, s]));
    const relevantWorksheets = allocatedWorksheets.filter((w) =>
      studentMap.has(w.studentId)
    );

    if (relevantWorksheets.length === 0) {
      showNotification(
        language === "hi"
          ? "इस कक्षा के किसी भी विद्यार्थी के पास अभ्यास पत्रक नहीं हैं।"
          : "No practice worksheets are allocated for this classroom.",
        "info"
      );
      return;
    }

    const entries = relevantWorksheets.map((ws) => ({
      ws,
      student: studentMap.get(ws.studentId)!,
    }));

    const fullHtml = generateCombinedClassHtml(targetClass, entries);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    } else {
      showNotification("Popup blocked! Please allow popups to print class worksheets.", "error");
    }
  };

  // CSV / JSON Exports
  const exportStudentsCSV = () => {
    const headers = ["ID", "Name", "Class/Grade", "Roll No", "Active Gaps", "Last Assessed"];
    const rows = students.map((s) => {
      const gCount = learningGaps.filter((g) => g.studentId === s.id && g.status === "active").length;
      return [s.id, `"${s.name}"`, s.grade, s.rollNo, gCount, s.lastAssessedAt || "Never"];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sahayak_students_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGapsCSV = () => {
    const headers = ["Gap ID", "Student ID", "Gap Type", "Subject", "Status", "First Detected", "Tier"];
    const rows = learningGaps.map((g) => [
      g.id,
      g.studentId,
      `"${g.gapTypeId}"`,
      g.subject,
      g.status,
      g.firstDetectedAt || "",
      g.currentTier || 1,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sahayak_learning_gaps_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAuditJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      classes,
      studentsCount: students.length,
      students,
      learningGaps,
      allocatedWorksheets,
      syncLogs,
      supabaseStatus,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `sahayak_full_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------------------------------------------------------------------------
  // Offline Mobile Data Ingestion Helpers
  // ---------------------------------------------------------------------------
  const parseOfflinePackage = (raw: any) => {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid JSON: Root must be an object");
    }

    const defaultClassId = `cls_imported_${Date.now()}`;
    let importedClasses: ClassEntity[] = [];

    if (Array.isArray(raw.classes) && raw.classes.length > 0) {
      importedClasses = raw.classes.map((c: any) => ({
        id: c.id || `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        teacherId: c.teacherId || "tea_demo",
        name: c.name || "Imported Classroom",
        gradeBand: c.gradeBand || "Class 1",
        studentsPerDay: c.studentsPerDay || 5,
        reassessmentDays: c.reassessmentDays || 14,
        version: c.version || 1,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
      }));
    } else if (raw.classroom) {
      const c = raw.classroom;
      importedClasses = [
        {
          id: c.id || defaultClassId,
          teacherId: c.teacherId || raw.teacher?.id || "tea_mobile",
          name: c.classroomName || c.name || `${raw.teacher?.name || "Mobile"}'s Classroom`,
          gradeBand: c.gradeBand || "Class 1",
          studentsPerDay: c.studentsPerDay || 5,
          reassessmentDays: c.reassessmentDays || 14,
          version: c.version || 1,
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
        },
      ];
    }

    const primaryClassId = importedClasses[0]?.id || classes[0]?.id || "cls_primary_1";

    const rawStudents = Array.isArray(raw.students) ? raw.students : [];
    const importedStudents: StudentEntity[] = rawStudents.map((s: any, idx: number) => ({
      id: s.id || `stu_import_${Date.now()}_${idx}`,
      classId: s.classId || primaryClassId,
      name: s.name || `Student ${idx + 1}`,
      grade: (s.grade === 2 || s.grade === 3 ? s.grade : 1) as 1 | 2 | 3,
      rollNo: s.rollNo ? String(s.rollNo) : String(idx + 1).padStart(2, "0"),
      avatarTint: s.avatarTint || "teal",
      isArchived: Boolean(s.isArchived),
      version: s.version || 1,
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: s.updatedAt || new Date().toISOString(),
      lastAssessedAt: s.lastAssessedAt || null,
    }));

    const rawGaps = Array.isArray(raw.gaps)
      ? raw.gaps
      : Array.isArray(raw.learningGaps)
      ? raw.learningGaps
      : [];
    const importedGaps: LearningGapEntity[] = rawGaps.map((g: any, idx: number) => ({
      id: g.id || `gap_import_${Date.now()}_${idx}`,
      studentId: g.studentId,
      gapTypeId: g.gapTypeId,
      subject: g.subject === "numeracy" ? "numeracy" : "reading",
      status: g.status === "resolved" ? "resolved" : "active",
      currentTier: (g.currentTier === 2 || g.currentTier === 3 ? g.currentTier : 1) as 1 | 2 | 3,
      firstDetectedAt: g.firstDetectedAt || new Date().toISOString(),
      lastDetectedAt: g.lastDetectedAt || new Date().toISOString(),
      resolvedAt: g.resolvedAt || null,
      reassessmentDueAt: g.reassessmentDueAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      worksheetIds: Array.isArray(g.worksheetIds) ? g.worksheetIds : [],
      assessmentIds: Array.isArray(g.assessmentIds) ? g.assessmentIds : [],
      version: g.version || 1,
      createdAt: g.createdAt || new Date().toISOString(),
      updatedAt: g.updatedAt || new Date().toISOString(),
    }));

    const rawAssessments = Array.isArray(raw.assessments) ? raw.assessments : [];
    const importedAssessments: AssessmentEntity[] = rawAssessments.map((a: any, idx: number) => ({
      id: a.id || `asm_import_${Date.now()}_${idx}`,
      studentId: a.studentId,
      classId: a.classId || primaryClassId,
      subject: a.subject === "numeracy" ? "numeracy" : "reading",
      grade: (a.grade === 2 || a.grade === 3 ? a.grade : 1) as 1 | 2 | 3,
      promptId: a.promptId || "general",
      kind: a.kind || "initial",
      relatedGapId: a.relatedGapId,
      detectedGapTypeIds: Array.isArray(a.detectedGapTypeIds) ? a.detectedGapTypeIds : [],
      evidence: a.evidence || {},
      analysisSource: a.analysisSource || "teacher-assisted",
      summary: a.summary || "Offline assessment observation",
      version: a.version || 1,
      timestamp: a.timestamp || new Date().toISOString(),
      createdAt: a.createdAt || a.timestamp || new Date().toISOString(),
      updatedAt: a.updatedAt || new Date().toISOString(),
    }));

    const rawWorksheets = Array.isArray(raw.worksheets)
      ? raw.worksheets
      : Array.isArray(raw.allocatedWorksheets)
      ? raw.allocatedWorksheets
      : [];

    return {
      format: raw.format || "custom-json",
      source: raw.source || "offline-file",
      teacher: raw.teacher,
      classes: importedClasses,
      students: importedStudents,
      learningGaps: importedGaps,
      assessments: importedAssessments,
      worksheets: rawWorksheets,
    };
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const bundle = parseOfflinePackage(parsed);
        setImportFileName(file.name);
        setParsedImportData(bundle);
        setImportStatus({
          type: "info",
          message:
            language === "hi"
              ? `फ़ाइल '${file.name}' सफलतापूर्वक पार्स की गई: ${bundle.students.length} विद्यार्थी, ${bundle.learningGaps.length} लर्निंग गैप।`
              : `File '${file.name}' parsed: Found ${bundle.students.length} students, ${bundle.learningGaps.length} learning gaps.`,
        });
      } catch (err: any) {
        console.error("Failed to parse file:", err);
        setImportStatus({
          type: "error",
          message: `Failed to parse offline file: ${err?.message || "Invalid JSON format"}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImportFromLocalApp = async () => {
    try {
      setIsImporting(true);
      let snap = await loadSnapshot();
      if (!snap || !snap.students || snap.students.length === 0) {
        if (snapshot && snapshot.students && snapshot.students.length > 0) {
          snap = snapshot;
        }
      }
      if (!snap || !snap.students || snap.students.length === 0) {
        setImportStatus({
          type: "error",
          message:
            language === "hi"
              ? "स्थानीय मोबाइल वॉल्ट में कोई विद्यार्थी डेटा नहीं मिला। कृपया पहले मोबाइल शिक्षक ऐप खोलकर मूल्यांकन दर्ज करें।"
              : "No offline student records found in this browser's local mobile vault. Please record students or assessments in the Teacher App first.",
        });
        showNotification(
          language === "hi"
            ? "मोबाइल वॉल्ट में कोई डेटा नहीं मिला"
            : "No records found in local mobile vault",
          "error"
        );
        return;
      }
      const bundle = parseOfflinePackage(snap);
      const vaultLabel = language === "hi" ? "स्थानीय मोबाइल वॉल्ट (IndexedDB)" : "Local Mobile Vault (IndexedDB)";
      setImportFileName(vaultLabel);
      // Directly commit and sync in 1 click!
      await handleCommitImport(bundle, vaultLabel);
    } catch (err: any) {
      console.error("Local app vault import error:", err);
      setImportStatus({
        type: "error",
        message: `Failed to read local app vault: ${err?.message || "Unknown error"}`,
      });
      showNotification("Failed to read local app vault", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleParsePastedJson = () => {
    if (!importJsonText.trim()) {
      setImportStatus({
        type: "error",
        message: "Please paste valid JSON before parsing.",
      });
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText.trim());
      const bundle = parseOfflinePackage(parsed);
      setImportFileName("Pasted JSON Document");
      setParsedImportData(bundle);
      setImportStatus({
        type: "info",
        message:
          language === "hi"
            ? `JSON पार्स हो गया: ${bundle.students.length} विद्यार्थी, ${bundle.learningGaps.length} अंतराल पाए गए।`
            : `JSON parsed: Found ${bundle.students.length} students, ${bundle.learningGaps.length} gaps.`,
      });
    } catch (err: any) {
      setImportStatus({
        type: "error",
        message: `Invalid JSON format: ${err?.message || "Syntax error"}`,
      });
    }
  };

  const handleCommitImport = async (
    overrideData?: typeof parsedImportData,
    customSource?: string
  ) => {
    const data = overrideData || parsedImportData;
    if (!data) return;

    try {
      setIsImporting(true);
      const sourceName = customSource || importFileName || "offline-package";
      const nowIso = new Date().toISOString();

      // 1. Merge & Upsert Classes
      if (data.classes && data.classes.length > 0) {
        for (const cls of data.classes) {
          try {
            await portalFetch("/api/classes", {
              method: "POST",
              body: JSON.stringify(cls),
            });
          } catch (e) {
            console.warn("Class server sync warning:", e);
          }
        }
        setClasses((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          for (const c of data.classes) {
            map.set(c.id, { ...(map.get(c.id) || {}), ...c, updatedAt: nowIso });
          }
          const nextClasses = Array.from(map.values());
          try {
            localStorage.setItem("sahayak_portal_classes", JSON.stringify(nextClasses));
          } catch {}
          return nextClasses;
        });
      }

      // 2. Merge & Upsert Students with Diff Tracking
      let addedStudentsCount = 0;
      let updatedStudentsCount = 0;
      if (data.students && data.students.length > 0) {
        for (const stu of data.students) {
          try {
            await portalFetch("/api/students", {
              method: "POST",
              body: JSON.stringify(stu),
            });
          } catch (e) {
            console.warn("Student server sync warning:", e);
          }
        }
        setStudents((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          for (const s of data.students) {
            if (map.has(s.id)) {
              updatedStudentsCount++;
              const existing = map.get(s.id)!;
              map.set(s.id, {
                ...existing,
                ...s,
                lastAssessedAt: s.lastAssessedAt || existing.lastAssessedAt || nowIso,
                updatedAt: nowIso,
              });
            } else {
              addedStudentsCount++;
              map.set(s.id, {
                ...s,
                lastAssessedAt: s.lastAssessedAt || nowIso,
                updatedAt: nowIso,
              });
            }
          }
          const nextStudents = Array.from(map.values());
          try {
            localStorage.setItem("sahayak_portal_students", JSON.stringify(nextStudents));
          } catch {}
          return nextStudents;
        });
      }

      // 3. Merge & Upsert Learning Gaps with Diff Tracking
      let addedGapsCount = 0;
      let updatedGapsCount = 0;
      if (data.learningGaps && data.learningGaps.length > 0) {
        for (const gap of data.learningGaps) {
          try {
            await portalFetch("/api/learning-gaps", {
              method: "POST",
              body: JSON.stringify(gap),
            });
          } catch (e) {
            console.warn("Learning gap server sync warning:", e);
          }
        }
        setLearningGaps((prev) => {
          const map = new Map(prev.map((g) => [g.id, g]));
          for (const g of data.learningGaps) {
            if (map.has(g.id)) {
              updatedGapsCount++;
              const existing = map.get(g.id)!;
              map.set(g.id, {
                ...existing,
                ...g,
                updatedAt: nowIso,
              });
            } else {
              addedGapsCount++;
              map.set(g.id, {
                ...g,
                updatedAt: nowIso,
              });
            }
          }
          const nextGaps = Array.from(map.values());
          try {
            localStorage.setItem("sahayak_portal_gaps", JSON.stringify(nextGaps));
          } catch {}
          return nextGaps;
        });
      }

      // 4. Merge Worksheets
      if (data.worksheets && data.worksheets.length > 0) {
        setAllocatedWorksheets((prev) => {
          const map = new Map(prev.map((w) => [w.id, w]));
          for (const w of data.worksheets) {
            map.set(w.id, { ...(map.get(w.id) || {}), ...w });
          }
          const nextWorksheets = Array.from(map.values());
          try {
            localStorage.setItem("sahayak_portal_worksheets", JSON.stringify(nextWorksheets));
          } catch {}
          return nextWorksheets;
        });
      }

      // 4b. Ingest Assessments to central server
      if (data.assessments && data.assessments.length > 0) {
        for (const asm of data.assessments) {
          try {
            await portalFetch("/api/assessments", {
              method: "POST",
              body: JSON.stringify(asm),
            });
          } catch (e) {
            console.warn("Assessment server sync warning:", e);
          }
        }
      }

      // 4c. Auto-reset class and status filters so imported students/gaps are immediately visible
      setSelectedClassId("all");
      setSelectedGradeFilter("all");
      setSelectedStatusFilter("all");

      // 4d. Mirror to local IndexedDB for cross-app synchronization
      try {
        const currentSnap = await loadSnapshot();
        if (currentSnap) {
          const mergedStudents = [...currentSnap.students];
          for (const s of data.students) {
            const idx = mergedStudents.findIndex((ms) => ms.id === s.id);
            if (idx >= 0) {
              mergedStudents[idx] = { ...mergedStudents[idx], ...s };
            } else {
              mergedStudents.push(s as any);
            }
          }
          const mergedGaps = [...currentSnap.gaps];
          for (const g of data.learningGaps) {
            const idx = mergedGaps.findIndex((mg) => mg.id === g.id);
            if (idx >= 0) {
              mergedGaps[idx] = { ...mergedGaps[idx], ...g };
            } else {
              mergedGaps.push(g as any);
            }
          }
          await saveSnapshot({
            ...currentSnap,
            students: mergedStudents,
            gaps: mergedGaps,
            assessments:
              data.assessments && data.assessments.length > 0
                ? Array.from(
                    new Map(
                      [...currentSnap.assessments, ...data.assessments].map((a) => [a.id, a as any])
                    ).values()
                  )
                : currentSnap.assessments,
          });
        }
      } catch (e) {
        console.warn("Could not mirror import to local IndexedDB:", e);
      }

      // 5. Append Sync Log Entry for Audit Trail
      const syncDetail =
        addedStudentsCount > 0
          ? `Synced ${data.students.length} pupils (${addedStudentsCount} new enrolled, ${updatedStudentsCount} updated) & ${data.learningGaps.length} gaps from ${sourceName}`
          : `Synced ${data.students.length} pupils (${updatedStudentsCount} profiles updated with latest offline records) & ${data.learningGaps.length} gaps from ${sourceName}`;

      const newLog: SyncLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        operationId: `op_import_${Date.now()}`,
        entityType: "student",
        entityId: `batch_${data.students.length}_records`,
        operation: "UPDATE",
        clientId: sourceName,
        status: "SYNCED",
        clientVersion: 1,
        serverVersion: 1,
        receivedAt: nowIso,
        details: syncDetail,
      };
      setSyncLogs((prev) => [newLog, ...prev]);

      // 6. Save Sync Summary
      const summaryObj = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        addedStudents: addedStudentsCount,
        updatedStudents: updatedStudentsCount,
        totalStudents: data.students.length,
        gapsCount: data.learningGaps.length,
        source: sourceName,
      };
      setLastSyncSummary(summaryObj);
      try {
        localStorage.setItem("sahayak_portal_last_sync", JSON.stringify(summaryObj));
      } catch {}

      // 7. Success Notifications with Crystal Clear Explanation
      let successMsg = "";
      if (language === "hi") {
        successMsg =
          addedStudentsCount > 0
            ? `सफलतापूर्वक सिंक किया गया: ${addedStudentsCount} नए विद्यार्थी जोड़े गए, ${updatedStudentsCount} अपडेट हुए, और ${data.learningGaps.length} शिक्षण अंतराल सिंक हुए!`
            : `सफलतापूर्वक सिंक किया गया: सभी ${updatedStudentsCount} विद्यार्थियों के ऑफ़लाइन रिकॉर्ड्स और ${data.learningGaps.length} शिक्षण अंतराल अपडेट हुए!`;
      } else {
        successMsg =
          addedStudentsCount > 0
            ? `Successfully Synced: Enrolled ${addedStudentsCount} new pupils, updated ${updatedStudentsCount} profiles, and synced ${data.learningGaps.length} FLN learning gaps!`
            : `Successfully Synced: Updated ${updatedStudentsCount} pupil profiles with latest offline assessments & timestamps (${data.learningGaps.length} learning gaps synced)!`;
      }

      setImportStatus({
        type: "success",
        message: successMsg,
      });
      showNotification(successMsg, "success");

      // Reset staged import
      setParsedImportData(null);
      setImportFileName(null);
      setImportJsonText("");
    } catch (err: any) {
      console.error("Failed to commit import:", err);
      setImportStatus({
        type: "error",
        message: `Commit failed: ${err?.message || "Unknown error"}`,
      });
      showNotification("Failed to commit imported data", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Web Portal Authentication Gate Screen
  // ---------------------------------------------------------------------------
  if (!isPortalAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col justify-between font-sans">
        {/* Top Navbar */}
        <header className="border-b border-border/80 bg-card/80 backdrop-blur-xl px-6 py-3.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary to-violet-600 text-white shrink-0 shadow-md shadow-primary/25">
                <BookOpen className="h-5 w-5" strokeWidth={2.4} />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-base text-foreground tracking-tight">
                  {language === "hi" ? "सहायक केंद्रीय वेब पोर्टल" : "Sahayak Central Web Portal"}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  {language === "hi" ? "कक्षा 1–3 बुनियादी साक्षरता एवं संख्यात्मकता (FLN) हब" : "NIPUN Bharat FLN Teacher Management & Remediation Platform"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Language"
                className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5 shadow-2xs"
              >
                <LangButton active={language === "en"} onClick={() => setLanguage("en")}>
                  EN
                </LangButton>
                <LangButton active={language === "hi"} onClick={() => setLanguage("hi")}>
                  हिंदी
                </LangButton>
              </div>

              <Link
                to="/mobile"
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all"
              >
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span>{language === "hi" ? "शिक्षक मोबाइल ऐप" : "Teacher Mobile App"}</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
              <Link
                to="/mobile/login"
                className="inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all"
                title="Teacher Mobile Login"
              >
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>{language === "hi" ? "लॉगिन" : "Teacher Login"}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Floating Notification */}
        {feedbackMessage && (
          <div
            className={`border-b px-6 py-2 text-xs text-center font-medium flex items-center justify-center gap-2 ${
              feedbackMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : feedbackMessage.type === "info"
                ? "bg-sky-50 border-sky-200 text-sky-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Central Login Card */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-primary to-violet-500" />

            <div className="text-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3 ring-1 ring-primary/20">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
                {language === "hi" ? "केंद्रीय वेब पोर्टल लॉगिन" : "Central Portal Sign In"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                {language === "hi"
                  ? "प्रशासनिक नियंत्रण, विद्यार्थी डेटा और अभ्यास पत्रक आबंटन हेतु लॉगिन करें।"
                  : "Access school command center, multi-tier practice allocations, and FLN analytics."}
              </p>
            </div>

            {loginError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handlePortalLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>{language === "hi" ? "उपयोगकर्ता नाम / शिक्षक का नाम" : "Username or Teacher Name"}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={language === "hi" ? "उदा. admin या Prerna Sharma" : "e.g. admin or Prerna Sharma"}
                    className="w-full pl-9.5 pr-4 py-2.5 text-xs bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>{language === "hi" ? "पासवर्ड" : "Password"}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPortalPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={language === "hi" ? "पासवर्ड दर्ज करें" : "Enter password"}
                    className="w-full pl-9.5 pr-10 py-2.5 text-xs bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPortalPassword(!showPortalPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPortalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-2 shadow-sm transition-all"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{language === "hi" ? "सत्यापित हो रहा है..." : "Authenticating..."}</span>
                  </>
                ) : (
                  <>
                    <span>{language === "hi" ? "पोर्टल में प्रवेश करें" : "Sign In to Central Portal"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Logins */}
            <div className="mt-6 pt-5 border-t border-border/70">
              <p className="text-[11px] font-semibold text-muted-foreground text-center uppercase tracking-wider mb-2.5">
                {language === "hi" ? "1-क्लिक त्वरित डेमो लॉगिन" : "1-Click Demo Login"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoginUsername("admin");
                    setLoginPassword("admin123");
                    handlePortalLoginSubmit(undefined, "admin", "admin123");
                  }}
                  className="rounded-xl text-left justify-start h-auto py-2 px-3 border-border/80 bg-muted/30 hover:bg-muted/70 hover:border-primary/40 text-xs"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      👑 Admin
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">admin / admin123</span>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoginUsername("Prerna Sharma");
                    setLoginPassword("teacher123");
                    handlePortalLoginSubmit(undefined, "Prerna Sharma", "teacher123");
                  }}
                  className="rounded-xl text-left justify-start h-auto py-2 px-3 border-border/80 bg-muted/30 hover:bg-muted/70 hover:border-primary/40 text-xs"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      👩‍🏫 Teacher
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Prerna / teacher123</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-5 pt-4 border-t border-border/50 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>NIPUN Bharat FLN · 256-Bit Vault Auth Enforced</span>
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/70 py-4 px-6 text-center text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Sahayak (SAH-PS-2) — Teacher Management & Practice Allocation Platform</span>
            <span className="font-mono text-[11px]">NIPUN Bharat Aligned · Offline First</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-xl px-6 py-3.5 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary to-violet-600 text-white shrink-0 shadow-md shadow-primary/25 ring-1 ring-white/20">
              <BookOpen className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-lg text-foreground tracking-tight">
                  {language === "hi" ? "सहायक केंद्रीय वेब पोर्टल" : "Sahayak FLN Command Center"}
                </h1>
                <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-bold tracking-wider">
                  NIPUN Bharat Aligned
                </span>
                <span
                  className={`badge-pill text-[10px] font-semibold ${
                    supabaseStatus?.connected
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-teal-50 text-teal-800 border border-teal-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      supabaseStatus?.connected ? "bg-emerald-500" : "bg-teal-500"
                    } animate-pulse`}
                  />
                  {supabaseStatus?.connected
                    ? language === "hi"
                      ? "क्लाउड सिंक सक्रिय"
                      : "Cloud Sync Active"
                    : language === "hi"
                    ? "स्थानीय वॉल्ट + सुपाबेस"
                    : "Local Vault + Supabase SDK"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "hi"
                  ? "कक्षा 1–3 बुनियादी साक्षरता एवं संख्यात्मकता (FLN) शिक्षक प्रबंधन, व्यक्तिगत निदान व अभ्यास पत्रक हब"
                  : "Foundational Literacy & Numeracy (FLN) Teacher Management, Gap Diagnosis & Practice Hub"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Switcher */}
            <div
              role="group"
              aria-label="Language"
              className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5 shadow-2xs"
            >
              <LangButton active={language === "en"} onClick={() => setLanguage("en")}>
                EN
              </LangButton>
              <LangButton active={language === "hi"} onClick={() => setLanguage("hi")}>
                हिंदी
              </LangButton>
            </div>

            {/* Quick Enroll Student */}
            <Button
              size="sm"
              className="rounded-full text-xs h-9 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs"
              onClick={handleOpenCreateStudent}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {language === "hi" ? "+ नया विद्यार्थी" : "+ Enroll Student"}
            </Button>

            {/* Demo Seed */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-9 px-3.5 border-border bg-card hover:bg-muted font-semibold text-foreground gap-1.5 shadow-2xs"
              onClick={handleSeedDemoData}
              disabled={seeding}
            >
              <Sparkles className={`h-3.5 w-3.5 text-amber-500 ${seeding ? "animate-spin" : ""}`} />
              {seeding
                ? language === "hi"
                  ? "लोड हो रहा है..."
                  : "Seeding..."
                : language === "hi"
                ? "FLN डेमो डेटा"
                : "Seed Demo"}
            </Button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-9 px-3 border-border bg-card hover:bg-muted font-medium shadow-2xs"
              onClick={fetchCentralData}
              disabled={refreshing}
              title="Refresh Records"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-primary ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>

            {/* Teacher App Link */}
            <div className="flex items-center gap-1.5">
              <Link
                to="/mobile"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>{language === "hi" ? "शिक्षक मोबाइल ऐप" : "Teacher Mobile App"}</span>
              </Link>
              <Link
                to="/mobile/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all"
                title="Teacher Mobile Login / Switch"
              >
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">{language === "hi" ? "मोबाइल लॉगिन" : "Teacher Login"}</span>
              </Link>
            </div>

            {/* User Session Badge & Sign Out */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border/70">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {portalUser?.username || "Administrator"}
                <span className="text-[10px] text-muted-foreground/70 font-mono">({portalUser?.role || "Admin"})</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortalSignOut}
                className="h-9 px-3.5 rounded-full text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 font-semibold gap-1.5 shadow-2xs transition-colors"
                title="Log out of Central Portal"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{language === "hi" ? "लॉग आउट" : "Log Out"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Notification Banner */}
      {feedbackMessage && (
        <div
          className={`border-b px-6 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2 transition-all ${
            feedbackMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : feedbackMessage.type === "info"
              ? "bg-sky-50 border-sky-200 text-sky-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Institutional Multi-Page Web Navigation Sub-Header */}
      <nav className="border-b border-border/80 bg-card/95 backdrop-blur-xl sticky top-[73px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "सिंहावलोकन" : "Overview"}</span>
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "students"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "विद्यार्थी एवं जरूरतें" : "Pupils & Needs"}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === "students" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {students.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("worksheets")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "worksheets"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "अभ्यास पत्रक बैंक" : "Worksheet Bank"}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === "worksheets" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {allocatedWorksheets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("gaps")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "gaps"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
              <span>{language === "hi" ? "कौशल अंतराल" : "Skill Gaps"}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === "gaps" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-700"
                }`}
              >
                {activeGapsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("interventionCircles")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "interventionCircles"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === "hi" ? "सहायता समूह" : "Support Circles"}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === "interventionCircles" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"
                }`}
              >
                {aggregatedGaps.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("classes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "classes"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <School className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "कक्षाएं" : "Classrooms"}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === "classes" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {classes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span>{language === "hi" ? "एनालिटिक्स" : "Analytics"}</span>
            </button>

            <button
              onClick={() => setActiveTab("syncLogs")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "syncLogs"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "ऑफ़लाइन सिंक" : "Offline Ingest"}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === "syncLogs" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {syncLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "reports"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "रिपोर्ट्स" : "Reports"}</span>
            </button>

            <button
              onClick={() => setActiveTab("workflow")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "workflow"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "कार्यप्रणाली" : "How It Works"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Dedicated Page Breadcrumb Navigation (Shown on non-overview pages) */}
        {activeTab !== "overview" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                onClick={() => setActiveTab("overview")}
                className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Portal</span>
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-bold text-foreground capitalize">
                {activeTab === "students" && (language === "hi" ? "विद्यार्थी एवं जरूरतें" : "Pupils & Learning Needs")}
                {activeTab === "worksheets" && (language === "hi" ? "अभ्यास पत्रक बैंक" : "Worksheet Bank & Practice Allocation")}
                {activeTab === "gaps" && (language === "hi" ? "कौशल अंतराल मैट्रिक्स" : "FLN Competency Gaps Matrix")}
                {activeTab === "interventionCircles" && (language === "hi" ? "सहायता समूह" : "Remedial Support Circles")}
                {activeTab === "classes" && (language === "hi" ? "कक्षाएं" : "Classrooms & Grade Sections")}
                {activeTab === "analytics" && (language === "hi" ? "एनालिटिक्स" : "Visual Analytics & Progress")}
                {activeTab === "syncLogs" && (language === "hi" ? "ऑफ़लाइन सिंक स्टेशन" : "Offline Mobile Ingest Station")}
                {activeTab === "reports" && (language === "hi" ? "रिपोर्ट्स एवं रजिस्टर" : "Reports & Official Registers")}
                {activeTab === "workflow" && (language === "hi" ? "कार्यप्रणाली एवं गाइड" : "Operational Workflow & Pedagogy")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/60 hidden sm:inline-block">
                Route: /portal/{TAB_TO_SLUG[activeTab]}
              </span>
              <button
                onClick={() => setActiveTab("overview")}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                ← Back to Overview
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Unified Executive KPI Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Card 1: Students */}
          <div
            onClick={() => setActiveTab("students")}
            className="group relative overflow-hidden bg-card border border-border/80 rounded-2xl p-4.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-500/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Pupils</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">{students.length}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                Roster <ArrowUpRight className="h-3 w-3" />
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {classes.length} Classes
              </span>
            </div>
          </div>

          {/* Card 2: Reading Gaps */}
          <div
            onClick={() => {
              setGapSubjectFilter("reading");
              setActiveTab("gaps");
            }}
            className="group relative overflow-hidden bg-card border border-border/80 rounded-2xl p-4.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-rose-500/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Reading</span>
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center ring-1 ring-rose-500/20 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">{readingGapsCount}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                Phonics & Words <ArrowUpRight className="h-3 w-3" />
              </span>
              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold font-mono">
                FLN Needs
              </span>
            </div>
          </div>

          {/* Card 3: Numeracy Gaps */}
          <div
            onClick={() => {
              setGapSubjectFilter("numeracy");
              setActiveTab("gaps");
            }}
            className="group relative overflow-hidden bg-card border border-border/80 rounded-2xl p-4.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-amber-500/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Numeracy</span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-1 ring-amber-500/20 group-hover:scale-110 transition-transform">
                  <Calculator className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">{numeracyGapsCount}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                Place Value & Math <ArrowUpRight className="h-3 w-3" />
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold font-mono">
                Decades
              </span>
            </div>
          </div>

          {/* Card 4: Allocated Worksheets */}
          <div
            onClick={() => setActiveTab("worksheets")}
            className="group relative overflow-hidden bg-card border border-border/80 rounded-2xl p-4.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-violet-500/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Worksheets</span>
                <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center ring-1 ring-violet-500/20 group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">{allocatedWorksheets.length}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
                Practice Drills <ArrowUpRight className="h-3 w-3" />
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Tier 1–3
              </span>
            </div>
          </div>

          {/* Card 5: Resolved & Mastery */}
          <div
            onClick={() => {
              setSelectedStatusFilter("ontrack");
              setActiveTab("students");
            }}
            className="group relative overflow-hidden bg-card border border-border/80 rounded-2xl p-4.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Mastered</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{resolvedGapsCount}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                Verified Mastery <Check className="h-3 w-3" />
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold font-mono">
                {activeGapsCount + resolvedGapsCount > 0
                  ? `${Math.round((resolvedGapsCount / (activeGapsCount + resolvedGapsCount)) * 100)}%`
                  : "100%"}
              </span>
            </div>
          </div>

          {/* Card 6: Live Engine & Sync */}
          <div
            onClick={() => setActiveTab("syncLogs")}
            className="group relative overflow-hidden bg-card border border-border/80 rounded-2xl p-4.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-teal-500/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Sync Engine</span>
                <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center ring-1 ring-teal-500/20 group-hover:scale-110 transition-transform">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${supabaseStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-teal-500"}`} />
                <span className="text-sm font-bold text-foreground truncate">
                  {supabaseStatus?.connected ? "Cloud Synced" : "Local Vault"}
                </span>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
                {syncLogs.length} Audit Events <ArrowUpRight className="h-3 w-3" />
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Real-time
              </span>
            </div>
          </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Teacher Pipeline Banner */}
              <div className="glass-panel p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-heading font-extrabold text-base text-foreground">
                        {language === "hi"
                          ? "शिक्षक मोबाइल ऐप → केंद्रीय प्रबंधन पाइपलाइन"
                          : "Field Mobile App → Central FLN Orchestration"}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Continuous feedback loop connecting teacher micro-checks to tiered interventions
                      </p>
                    </div>
                  </div>
                  <span className="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Live Central Hub
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {language === "hi"
                    ? "शिक्षक कक्षा में 1-1 छोटे मूल्यांकन करते हैं। सभी पहचानी गई साक्षरता व संख्यात्मकता बाधाएं यहाँ केंद्रीय रूप से एकत्रित होती हैं, जिससे आप व्यक्तिगत सुधार योजनाएं बना सकते हैं और लक्षित अभ्यास पत्रक आबंटित कर सकते हैं।"
                    : "Teachers conduct 1-minute non-evaluative micro-checks in class. All identified foundational literacy & numeracy gaps stream to this central dashboard, where you can inspect individual improvement needs, allocate practice worksheets, and track remediations."}
                </p>

                {/* 4-Step Closed-Loop Remediation Pipeline Graphic */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="label-overline">Operational Closed-Loop Pipeline</span>
                    <span className="text-[11px] font-mono text-muted-foreground">Continuous Mastery Cycle</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Step 1 */}
                    <div
                      onClick={() => setActiveTab("students")}
                      className="group relative p-3.5 rounded-2xl bg-card border border-border/80 hover:border-indigo-500/40 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          STAGE 01
                        </span>
                        <Smartphone className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-bold text-xs text-foreground">Formative Micro-Check</h4>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        1-minute low-stress check with audio assistance.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div
                      onClick={() => setActiveTab("gaps")}
                      className="group relative p-3.5 rounded-2xl bg-card border border-border/80 hover:border-rose-500/40 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          STAGE 02
                        </span>
                        <AlertCircle className="h-4 w-4 text-rose-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-bold text-xs text-foreground">Gap Diagnosis</h4>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Identifies root causes (b/d mirror, decade jumps).
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div
                      onClick={() => setActiveTab("worksheets")}
                      className="group relative p-3.5 rounded-2xl bg-card border border-border/80 hover:border-violet-500/40 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          STAGE 03
                        </span>
                        <ClipboardList className="h-4 w-4 text-violet-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-bold text-xs text-foreground">Differentiated Drills</h4>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Allocates Tier 1–3 worksheets & support circles.
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div
                      onClick={() => setActiveTab("students")}
                      className="group relative p-3.5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          STAGE 04
                        </span>
                        <Award className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-bold text-xs text-foreground">Mastery Verification</h4>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Child reassessed; gap marked resolved upon mastery.
                      </p>
                    </div>
                  </div>
                </div>

                {students.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-4 bg-muted/30 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Your central database is currently empty. Click below to load realistic Class 1–3 foundational literacy & numeracy records.
                    </p>
                    <Button
                      onClick={handleSeedDemoData}
                      disabled={seeding}
                      className="rounded-full text-xs h-8 px-4 font-semibold"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Seed Realistic Demo Data
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Roster & Needs Preview */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      {language === "hi" ? "विद्यार्थी सुधार आवश्यकताएं पूर्वावलोकन" : "Student Profiles & Improvement Needs"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click any student to view their dossier, diagnosed gaps, and allocate practice sheets.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("students")}
                    className="text-xs text-primary font-semibold hover:bg-primary/10"
                  >
                    Manage all {students.length} students →
                  </Button>
                </div>

                <div className="divide-y divide-border">
                  {students.slice(0, 6).map((s) => {
                    const studentGaps = learningGaps.filter(
                      (g) => g.studentId === s.id && g.status === "active"
                    );
                    const studentSheets = allocatedWorksheets.filter((w) => w.studentId === s.id);

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentDetail(s);
                          setActiveTab("students");
                        }}
                        className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/40 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={s.name} tint={s.avatarTint as AvatarTint} size="sm" />
                          <div>
                            <p className="font-bold text-sm text-foreground">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Class {s.grade} · Roll #{s.rollNo}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {studentGaps.length > 0 ? (
                            <span className="badge-pill bg-rose-50 text-rose-800 border border-rose-200 text-[10px]">
                              {studentGaps.length} Needs Support
                            </span>
                          ) : (
                            <span className="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                              On Track
                            </span>
                          )}

                          {studentSheets.length > 0 && (
                            <span className="badge-pill bg-secondary/20 text-secondary border border-secondary/30 text-[10px]">
                              {studentSheets.length} Sheets
                            </span>
                          )}

                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Import Offline Mobile Data Card */}
            <div className="glass-panel p-6 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {language === "hi" ? "ऑफ़लाइन मोबाइल डेटा आयात" : "Import Offline Mobile Data"}
                  </h3>
                </div>
                <span className="badge-pill text-[10px] bg-primary/10 text-primary border border-primary/20">
                  {language === "hi" ? "ऑफ़लाइन सिंक" : "Offline Bridge"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {language === "hi"
                  ? "मोबाइल शिक्षक ऐप से बिना इंटरनेट के एकत्र किया गया डेटा (.json पैकेज) यहाँ लोड करें।"
                  : "Ingest data collected offline by teachers in the field via JSON export or direct local app vault."}
              </p>

              {/* Status Banner */}
              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                    importStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : importStatus.type === "error"
                      ? "bg-rose-50 text-rose-900 border-rose-200"
                      : "bg-blue-50 text-blue-900 border-blue-200"
                  }`}
                >
                  {importStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 font-medium">{importStatus.message}</div>
                </div>
              )}

              {/* Staged Data Preview & Commit */}
              {parsedImportData ? (
                <div className="p-3.5 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      📄 {importFileName || "Offline Package"}
                    </span>
                    <span className="badge-pill text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      Ready to Ingest
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-card p-2 rounded-xl border border-border">
                      <div className="font-mono font-bold text-sm text-primary">
                        {parsedImportData.students.length}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Students</div>
                    </div>
                    <div className="bg-card p-2 rounded-xl border border-border">
                      <div className="font-mono font-bold text-sm text-rose-600">
                        {parsedImportData.learningGaps.length}
                      </div>
                      <div className="text-[10px] text-muted-foreground">FLN Gaps</div>
                    </div>
                    <div className="bg-card p-2 rounded-xl border border-border">
                      <div className="font-mono font-bold text-sm text-secondary">
                        {parsedImportData.classes.length}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Classes</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full text-xs gap-1.5 bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90"
                      onClick={() => handleCommitImport()}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {language === "hi" ? "केंद्रीय डेटाबेस में जोड़ें" : "Commit to Database"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs px-2.5"
                      onClick={() => {
                        setParsedImportData(null);
                        setImportFileName(null);
                        setImportStatus(null);
                      }}
                      disabled={isImporting}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Primary Actions to Load Data */
                <div className="space-y-2 pt-1">
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl text-xs font-bold gap-2 py-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="h-4 w-4 text-primary" />
                    {language === "hi" ? "ऑफ़लाइन JSON फ़ाइल चुनें..." : "Upload Offline .JSON File..."}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-2xl text-xs font-bold gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs transition-all"
                    onClick={handleImportFromLocalApp}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                    )}
                    {language === "hi"
                      ? "⚡ स्थानीय मोबाइल वॉल्ट से 1-क्लिक सिंक करें"
                      : "⚡ 1-Click Sync from Local Mobile Vault"}
                  </Button>
                </div>
              )}

              {/* Last Sync Summary Badge */}
              {lastSyncSummary && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      {language === "hi" ? "मोबाइल वॉल्ट सिंक्रोनाइज़्ड" : "Mobile Vault Synchronized"}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full font-bold">
                      {lastSyncSummary.time}
                    </span>
                  </div>
                  <div className="text-[11px] text-foreground/80 leading-relaxed">
                    {lastSyncSummary.addedStudents > 0
                      ? `Enrolled ${lastSyncSummary.addedStudents} new pupil(s), updated ${lastSyncSummary.updatedStudents} pupil profile(s)`
                      : `Refreshed ${lastSyncSummary.updatedStudents} pupil profile(s) with latest assessment records`}
                    {` & synced ${lastSyncSummary.gapsCount} FLN learning gaps.`}
                  </div>
                  <div className="pt-1 border-t border-emerald-500/20 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab("students")}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {language === "hi" ? "अपडेटेड विद्यार्थी देखें →" : "View Synced Pupils →"}
                    </button>
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                      {lastSyncSummary.source}
                    </span>
                  </div>
                </div>
              )}

              {/* View Full Station Link */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("syncLogs")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {language === "hi" ? "पूर्ण आयात स्टेशन और ऑडिट खोलें" : "Open Full Offline Ingest Hub"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {syncLogs.length} audit logs
                </span>
              </div>

              {/* Recent Ingest Activity Snippet */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "hi" ? "हाल के आयात लॉग" : "Recent Ingest Logs"}
                </span>
                {syncLogs.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic py-2">
                    {language === "hi" ? "कोई डेटा आयात नहीं हुआ है।" : "No offline packages ingested yet."}
                  </p>
                ) : (
                  syncLogs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl border border-border bg-card/60 text-[11px] flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono font-bold uppercase text-primary text-[10px] mr-1.5">
                          [{log.operation}]
                        </span>
                        <span className="text-foreground font-medium truncate">
                          {log.details || log.entityId}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {formatShortDate(log.receivedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ========================================================================= */}
        {/* TAB 2: INDIVIDUAL STUDENT MANAGEMENT & IMPROVEMENT NEEDS */}
        {/* ========================================================================= */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              {/* Header & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground">
                    {language === "hi" ? "व्यक्तिगत विद्यार्थी प्रबंधन एवं अभ्यास आवंटन" : "Individual Student Management & Improvement Needs"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {language === "hi"
                      ? "प्रत्येक विद्यार्थी की साक्षरता व संख्यात्मकता बाधाएं देखें, टियर 1–3 अभ्यास पत्रक आबंटित करें और प्रगति ट्रैक करें।"
                      : "Manage enrolled pupils individually, inspect their specific learning hurdles, allocate tailored worksheet drills, and track remediation."}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleOpenCreateStudent}
                    size="sm"
                    className="rounded-full text-xs h-9 px-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gap-1.5 shadow-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {language === "hi" ? "+ नया विद्यार्थी जोड़ें" : "+ Enroll New Student"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-9 gap-1.5"
                    onClick={exportStudentsCSV}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll..."
                    className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Class Selector */}
                <select
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="all">All Classrooms</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Grade Selector */}
                <select
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                >
                  <option value="all">All Grades (1, 2, 3)</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                </select>

                {/* Status Filter */}
                <select
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Statuses</option>
                  <option value="gaps">Needs Improvement (Active Gaps)</option>
                  <option value="ontrack">On Track (No Gaps)</option>
                </select>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto border border-border rounded-2xl">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Class & Roll</th>
                      <th className="py-3 px-4">Identified Improvement Needs (Gaps)</th>
                      <th className="py-3 px-3 text-center">Allocated Sheets</th>
                      <th className="py-3 px-4 text-right">Individual Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                          No students found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const studentGaps = learningGaps.filter(
                          (g) => g.studentId === s.id && g.status === "active"
                        );
                        const studentSheets = allocatedWorksheets.filter((w) => w.studentId === s.id);

                        return (
                          <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                            {/* Name & Avatar */}
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              <div className="flex items-center gap-3">
                                <StudentAvatar name={s.name} tint={s.avatarTint as AvatarTint} size="sm" />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-sm">{s.name}</span>
                                    {s.lastAssessedAt && (
                                      <span className="badge-pill bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-mono">
                                        Assessed {formatShortDate(s.lastAssessedAt)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-muted-foreground font-normal">
                                    UUID: {s.id.slice(0, 10)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Class & Roll */}
                            <td className="py-3.5 px-3">
                              <span className="font-semibold block">Class {s.grade}</span>
                              <span className="text-[11px] font-mono text-muted-foreground">Roll #{s.rollNo}</span>
                            </td>

                            {/* Active Gaps */}
                            <td className="py-3.5 px-4">
                              {studentGaps.length === 0 ? (
                                <span className="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                                  ✓ On Track (No Active Gaps)
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {studentGaps.map((g) => {
                                    const meta = getGapType(g.gapTypeId);
                                    return (
                                      <span
                                        key={g.id}
                                        className={`badge-pill text-[9px] ${
                                          g.subject === "reading"
                                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                                            : "bg-amber-50 text-amber-800 border border-amber-200"
                                        }`}
                                      >
                                        {meta?.label.split(":")[0] || g.gapTypeId} (T{g.currentTier || 1})
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Allocated Worksheets Count */}
                            <td className="py-3.5 px-3 text-center">
                              {studentSheets.length > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedStudentDetail(s);
                                    setStudentModalTab("sheets");
                                  }}
                                  className="badge-pill bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 text-[10px] font-bold"
                                >
                                  {studentSheets.length} Sheet{studentSheets.length > 1 ? "s" : ""}
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-[11px] font-mono">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs h-7 px-3 border-secondary/30 text-secondary hover:bg-secondary/10 font-semibold gap-1"
                                onClick={() => {
                                  setSelectedStudentDetail(s);
                                  setStudentModalTab("needs");
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                Dossier & Gaps
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-xs h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditStudent(s)}
                                title="Edit Student Profile"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-xs h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                                onClick={() => handleDeleteStudent(s.id)}
                                title="Remove Student Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TARGETED WORKSHEET BANK & PUPIL ALLOCATION HUB */}
        {/* ========================================================================= */}
        {activeTab === "worksheets" && (
          <div className="space-y-6">
            {/* Header & Batch Controls */}
            <div className="glass-panel p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ClipboardList className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-xl text-foreground">
                        {language === "hi"
                          ? "लक्षित अभ्यास पत्रक बैंक एवं विद्यार्थी आबंटन हब"
                          : "Targeted Worksheet Bank & Pupil Allocation Hub"}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {language === "hi"
                          ? "विद्यार्थियों को आबंटित अभ्यास पत्रक देखें, टियर 1–3 ड्रिल ट्रैक करें और पूरी कक्षा के अभ्यास पत्रक एक साथ ZIP या प्रिंट में डाउनलोड करें।"
                          : "Inspect what is allocated to each student, manage practice progress, and batch download all worksheets for any classroom in a ready-to-print ZIP archive."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Batch Action Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Classroom Selector for Batch Action */}
                  <select
                    className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium"
                    value={worksheetClassFilter}
                    onChange={(e) => setWorksheetClassFilter(e.target.value)}
                    title="Select Classroom for Batch Download"
                  >
                    <option value="all">All Classrooms (Combined Batch)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Batch Download ZIP Button */}
                  <Button
                    size="sm"
                    className="rounded-full text-xs h-9 px-4 bg-primary text-primary-foreground font-bold gap-1.5 shadow-xs hover:bg-primary/90"
                    onClick={() => handleDownloadClassWorksheetsZip(worksheetClassFilter)}
                    disabled={isGeneratingZip}
                  >
                    {isGeneratingZip ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FolderArchive className="h-3.5 w-3.5" />
                    )}
                    {language === "hi"
                      ? "कक्षा अभ्यास पत्रक डाउनलोड करें (.ZIP)"
                      : "Download Class Sheets (.ZIP)"}
                  </Button>

                  {/* Batch Print Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-9 px-3.5 gap-1.5 border-border shadow-2xs"
                    onClick={() => handlePrintClassWorksheets(worksheetClassFilter)}
                    title="Print All Worksheets for Selected Class"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {language === "hi" ? "कक्षा प्रिंट करें" : "Print Class Sheets"}
                  </Button>

                  {/* Allocate Modal Trigger */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-9 px-3.5 gap-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/30 font-bold"
                    onClick={() => handleOpenAllocateModal()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {language === "hi" ? "+ नया आबंटन" : "+ Allocate to Pupil"}
                  </Button>
                </div>
              </div>

              {/* KPI Mini Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-card p-3 rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                    Total Allocated Sheets
                  </span>
                  <span className="font-heading font-bold text-xl text-primary">
                    {allocatedWorksheets.length} Active
                  </span>
                </div>

                <div className="bg-card p-3 rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                    Pupils Practicing
                  </span>
                  <span className="font-heading font-bold text-xl text-foreground">
                    {new Set(allocatedWorksheets.map((w) => w.studentId)).size} of {students.length}
                  </span>
                </div>

                <div className="bg-card p-3 rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                    Completed / Practiced
                  </span>
                  <span className="font-heading font-bold text-xl text-emerald-600">
                    {allocatedWorksheets.filter((w) => w.status === "practiced").length} Drills
                  </span>
                </div>

                <div className="bg-card p-3 rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                    Catalog Bank
                  </span>
                  <span className="font-heading font-bold text-xl text-secondary">
                    {WORKSHEET_TEMPLATES.length} Templates
                  </span>
                </div>
              </div>

              {/* View Mode Switcher Pills */}
              <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                <button
                  type="button"
                  onClick={() => setWorksheetViewMode("allocations")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    worksheetViewMode === "allocations"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  {language === "hi"
                    ? "विद्यार्थीवार आबंटन (Student Allocations)"
                    : "Student Allocations"}{" "}
                  ({allocatedWorksheets.length})
                </button>

                <button
                  type="button"
                  onClick={() => setWorksheetViewMode("templates")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    worksheetViewMode === "templates"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {language === "hi"
                    ? "अभ्यास पत्रक टेम्पलेट बैंक"
                    : "Worksheet Template Bank"}{" "}
                  ({WORKSHEET_TEMPLATES.length})
                </button>

                <button
                  type="button"
                  onClick={() => setWorksheetViewMode("classes")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    worksheetViewMode === "classes"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  <FolderArchive className="h-3.5 w-3.5" />
                  {language === "hi"
                    ? "कक्षा पैकेज एवं बैच ज़िप (.ZIP)"
                    : "Class Bundles & Batch ZIP"}{" "}
                  ({classes.length})
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-VIEW 1: BY STUDENT ALLOCATIONS (Know exactly what each student has) */}
            {/* ========================================================================= */}
            {worksheetViewMode === "allocations" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search pupil by name or roll..."
                      className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                      value={worksheetSearchQuery}
                      onChange={(e) => setWorksheetSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    value={worksheetClassFilter}
                    onChange={(e) => setWorksheetClassFilter(e.target.value)}
                  >
                    <option value="all">All Classrooms</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    value={worksheetGradeFilter}
                    onChange={(e) => setWorksheetGradeFilter(e.target.value)}
                  >
                    <option value="all">All Grades (1, 2, 3)</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                  </select>

                  <select
                    className="rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    value={worksheetStatusFilter}
                    onChange={(e) => setWorksheetStatusFilter(e.target.value as any)}
                  >
                    <option value="all">All Pupils (Allocated & Pending)</option>
                    <option value="assigned">Has Active Practice Sheets</option>
                    <option value="practiced">Has Practiced / Completed</option>
                  </select>
                </div>

                {/* Pupil Allocation Cards */}
                {(() => {
                  const filteredPupils = students.filter((s) => {
                    const matchesSearch =
                      !worksheetSearchQuery.trim() ||
                      s.name.toLowerCase().includes(worksheetSearchQuery.toLowerCase()) ||
                      s.rollNo.includes(worksheetSearchQuery.trim());
                    const matchesClass =
                      worksheetClassFilter === "all" || s.classId === worksheetClassFilter;
                    const matchesGrade =
                      worksheetGradeFilter === "all" || String(s.grade) === worksheetGradeFilter;

                    const studentSheets = allocatedWorksheets.filter((w) => w.studentId === s.id);
                    let matchesStatus = true;
                    if (worksheetStatusFilter === "assigned") {
                      matchesStatus = studentSheets.length > 0;
                    } else if (worksheetStatusFilter === "practiced") {
                      matchesStatus = studentSheets.some((w) => w.status === "practiced");
                    }

                    return matchesSearch && matchesClass && matchesGrade && matchesStatus;
                  });

                  if (filteredPupils.length === 0) {
                    return (
                      <div className="glass-panel p-12 text-center space-y-3">
                        <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                        <h3 className="font-heading font-bold text-base text-foreground">
                          No students found matching current filters
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Try resetting your search or classroom filter, or allocate a practice sheet to a pupil.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredPupils.map((s) => {
                        const studentSheets = allocatedWorksheets.filter((w) => w.studentId === s.id);
                        const studentClass = classes.find((c) => c.id === s.classId);
                        const activeGaps = learningGaps.filter(
                          (g) => g.studentId === s.id && g.status === "active"
                        );

                        return (
                          <div
                            key={s.id}
                            className="glass-panel p-5 space-y-4 hover:border-primary/40 transition-colors shadow-2xs"
                          >
                            {/* Student Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                              <div className="flex items-center gap-3">
                                <StudentAvatar
                                  name={s.name}
                                  tint={s.avatarTint || "teal"}
                                  size="md"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-heading font-bold text-base text-foreground">
                                      {s.name}
                                    </h3>
                                    <span className="font-mono text-xs font-bold text-muted-foreground">
                                      Roll #{s.rollNo}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span>Class {s.grade}</span>
                                    <span>·</span>
                                    <span>{studentClass?.name || "Classroom"}</span>
                                    {activeGaps.length > 0 && (
                                      <>
                                        <span>·</span>
                                        <span className="text-rose-600 font-semibold">
                                          {activeGaps.length} FLN Gaps
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                                  {studentSheets.length}{" "}
                                  {studentSheets.length === 1 ? "Worksheet" : "Worksheets"}
                                </span>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full text-xs h-8 px-3 gap-1.5 font-bold"
                                  onClick={() => handleOpenAllocateModal(s.id)}
                                >
                                  <Plus className="h-3 w-3" />
                                  {language === "hi" ? "शीट जोड़ें" : "+ Allocate Sheet"}
                                </Button>
                              </div>
                            </div>

                            {/* Allocated Sheets List */}
                            {studentSheets.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground italic">
                                  {language === "hi"
                                    ? "इस विद्यार्थी के पास अभी कोई अभ्यास पत्रक आबंटित नहीं है।"
                                    : "No practice worksheets allocated yet for this pupil."}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-full text-xs h-7 text-primary hover:underline font-bold"
                                  onClick={() => handleOpenAllocateModal(s.id)}
                                >
                                  + Assign Practice Now
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {studentSheets.map((ws) => (
                                  <div
                                    key={ws.id}
                                    className="p-3.5 rounded-2xl border border-border bg-card space-y-2.5 shadow-2xs flex flex-col justify-between"
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold">
                                          TIER {ws.tier}
                                        </span>
                                        <span
                                          className={`badge-pill text-[9px] font-bold ${
                                            ws.status === "practiced"
                                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                              : "bg-amber-50 text-amber-800 border border-amber-200"
                                          }`}
                                        >
                                          {ws.status === "practiced"
                                            ? "✓ Practiced"
                                            : "Assigned"}
                                        </span>
                                      </div>

                                      <h4 className="font-heading font-bold text-xs text-foreground line-clamp-1">
                                        {ws.title}
                                      </h4>

                                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                                        {ws.focus}
                                      </p>

                                      <span className="text-[10px] text-muted-foreground font-mono block">
                                        Assigned: {formatShortDate(ws.assignedAt)}
                                      </span>
                                    </div>

                                    {/* Item Actions */}
                                    <div className="pt-2 border-t border-border flex items-center justify-between gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full text-[11px] h-7 px-2.5 border-border font-medium flex-1 gap-1"
                                        onClick={() => setPreviewWorksheet(ws)}
                                        title="Preview and Print this student worksheet"
                                      >
                                        <Eye className="h-3 w-3" />
                                        Preview
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`rounded-full text-[11px] h-7 px-2 font-bold ${
                                          ws.status === "practiced"
                                            ? "text-muted-foreground"
                                            : "text-emerald-700 hover:bg-emerald-50"
                                        }`}
                                        onClick={() => handleMarkWorksheetPracticed(ws.id)}
                                        title="Toggle Practiced status"
                                      >
                                        {ws.status === "practiced" ? "Re-assign" : "Done"}
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full text-xs h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 shrink-0"
                                        onClick={() => handleRemoveAllocatedWorksheet(ws.id)}
                                        title="Remove allocation"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-VIEW 2: WORKSHEET TEMPLATE CATALOG (With pupil allocation counts) */}
            {/* ========================================================================= */}
            {worksheetViewMode === "templates" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {WORKSHEET_TEMPLATES.length} Foundational Practice Templates
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Matches NIPUN Bharat FLN competency learning outcomes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {WORKSHEET_TEMPLATES.map((tmpl) => {
                    // Find which students are currently allocated this template
                    const allocatedStudents = students.filter((s) =>
                      allocatedWorksheets.some(
                        (w) => w.studentId === s.id && (w.templateId === tmpl.id || w.title === tmpl.title)
                      )
                    );

                    return (
                      <div
                        key={tmpl.id}
                        className="p-5 rounded-3xl border border-border bg-card space-y-3.5 shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`badge-pill text-[9px] font-bold ${
                                tmpl.subject === "reading"
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {tmpl.subject.toUpperCase()} · TIER {tmpl.tier}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Grades: {tmpl.grades.join(", ")}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base text-foreground leading-tight">
                            {language === "hi" && tmpl.titleHi ? tmpl.titleHi : tmpl.title}
                          </h3>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {language === "hi" && tmpl.focusHi ? tmpl.focusHi : tmpl.focus}
                          </p>

                          {/* Currently Allocated To Chip */}
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground block uppercase font-mono mb-1">
                              Currently Allocated to:
                            </span>
                            {allocatedStudents.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic">
                                Not currently allocated to any pupil
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                                  {allocatedStudents.length}{" "}
                                  {allocatedStudents.length === 1 ? "Pupil" : "Pupils"}
                                </span>
                                {allocatedStudents.slice(0, 3).map((st) => (
                                  <span
                                    key={st.id}
                                    className="badge-pill bg-muted text-foreground text-[10px] font-medium"
                                  >
                                    {st.name.split(" ")[0]} (#{st.rollNo})
                                  </span>
                                ))}
                                {allocatedStudents.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    +{allocatedStudents.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-8 px-3 border-border font-medium flex-1 gap-1"
                            onClick={() => {
                              const mockInstance: WorksheetInstance = {
                                id: createId("ws"),
                                studentId: students[0]?.id || "stu_demo",
                                gapRecordId: "gap_demo",
                                templateId: tmpl.id,
                                assignedAt: new Date().toISOString(),
                                tier: tmpl.tier,
                                status: "assigned",
                                title: language === "hi" && tmpl.titleHi ? tmpl.titleHi : tmpl.title,
                                focus: language === "hi" && tmpl.focusHi ? tmpl.focusHi : tmpl.focus,
                                items: language === "hi" && tmpl.itemsHi ? tmpl.itemsHi : tmpl.items,
                              };
                              setPreviewWorksheet(mockInstance);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Button>

                          <Button
                            size="sm"
                            className="rounded-full text-xs h-8 px-3.5 bg-primary text-primary-foreground font-semibold flex-1 gap-1"
                            onClick={() => handleOpenAllocateModal(undefined, tmpl.id)}
                          >
                            <Plus className="h-3 w-3" />
                            Allocate to Pupil
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-VIEW 3: CLASS BUNDLES & DOWNLOAD ZIP */}
            {/* ========================================================================= */}
            {worksheetViewMode === "classes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Classroom Practice Bundles & Multi-Worksheet Archives
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Download complete ZIP folders containing individual and combined printable HTML files
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {classes.map((cls) => {
                    const classPupils = students.filter((s) => s.classId === cls.id);
                    const classPupilIds = new Set(classPupils.map((s) => s.id));
                    const classWorksheets = allocatedWorksheets.filter((w) =>
                      classPupilIds.has(w.studentId)
                    );
                    const pupilsWithSheets = classPupils.filter((s) =>
                      allocatedWorksheets.some((w) => w.studentId === s.id)
                    );

                    return (
                      <div
                        key={cls.id}
                        className="glass-panel p-6 space-y-4 flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="badge-pill bg-secondary/15 text-secondary border border-secondary/25 text-[10px] font-bold uppercase">
                                {cls.gradeBand || "Primary"}
                              </span>
                              <h3 className="font-heading font-bold text-lg text-foreground mt-1.5">
                                {cls.name}
                              </h3>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <School className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                            <div className="bg-card p-2.5 rounded-xl border border-border">
                              <div className="font-mono font-bold text-base text-foreground">
                                {classPupils.length}
                              </div>
                              <div className="text-[10px] text-muted-foreground">Enrolled Pupils</div>
                            </div>
                            <div className="bg-card p-2.5 rounded-xl border border-border">
                              <div className="font-mono font-bold text-base text-primary">
                                {classWorksheets.length}
                              </div>
                              <div className="text-[10px] text-muted-foreground">Allocated Sheets</div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground pt-1 space-y-1">
                            <p>
                              <span className="font-bold text-foreground">
                                {pupilsWithSheets.length} of {classPupils.length}
                              </span>{" "}
                              students have practice materials ready.
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Package includes: Individual student HTML sheets + 1-click master printable bundle.
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-3 border-t border-border">
                          <Button
                            className="w-full rounded-2xl text-xs font-bold gap-2 py-2.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                            onClick={() => handleDownloadClassWorksheetsZip(cls.id)}
                            disabled={isGeneratingZip || classWorksheets.length === 0}
                          >
                            {isGeneratingZip ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FolderArchive className="h-3.5 w-3.5" />
                            )}
                            {language === "hi"
                              ? "इस कक्षा की ZIP डाउनलोड करें"
                              : "Download Class ZIP (.zip)"}
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full rounded-2xl text-xs font-medium gap-2 py-2 border-border"
                            onClick={() => handlePrintClassWorksheets(cls.id)}
                            disabled={classWorksheets.length === 0}
                          >
                            <Printer className="h-3.5 w-3.5" />
                            {language === "hi" ? "कक्षा के सभी पत्रक प्रिंट करें" : "Print All Worksheets"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SKILL GAPS MATRIX */}
        {/* ========================================================================= */}
        {activeTab === "gaps" && (
          <div className="glass-panel p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {language === "hi" ? "सीखने के अंतराल वितरण मैट्रिक्स" : "Classroom Learning Gap Distribution Matrix"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Identified foundational literacy & numeracy hurdles requiring small-group support.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border">
                  <button
                    onClick={() => setGapSubjectFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      gapSubjectFilter === "all"
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({learningGaps.length})
                  </button>
                  <button
                    onClick={() => setGapSubjectFilter("reading")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      gapSubjectFilter === "reading"
                        ? "bg-card text-rose-700 shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Reading ({readingGapsCount})
                  </button>
                  <button
                    onClick={() => setGapSubjectFilter("numeracy")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      gapSubjectFilter === "numeracy"
                        ? "bg-card text-amber-700 shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Numeracy ({numeracyGapsCount})
                  </button>
                </div>

                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Grades</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                </select>
              </div>
            </div>

            {aggregatedGaps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 text-center">
                No active learning gaps recorded matching the current filter.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aggregatedGaps.map((item) => {
                  const meta = getGapType(item.gapTypeId);
                  return (
                    <div
                      key={item.gapTypeId}
                      className="p-5 rounded-3xl border border-border bg-card space-y-3.5 hover:border-primary/40 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`badge-pill text-[9px] ${
                                item.subject === "reading"
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {item.subject.toUpperCase()}
                            </span>
                            <span
                              className={`badge-pill text-[9px] ${
                                item.urgency === "persistent"
                                  ? "bg-rose-100 text-rose-900 font-bold"
                                  : item.urgency === "watch"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-emerald-100 text-emerald-900"
                              }`}
                            >
                              {item.urgency} priority
                            </span>
                          </div>
                          <h3 className="font-heading font-bold text-base text-foreground mt-1.5">
                            {language === "hi" && item.labelHi ? item.labelHi : item.label}
                          </h3>
                        </div>
                        <span className="font-mono text-xs font-bold bg-muted px-2.5 py-1 rounded-full text-foreground shrink-0">
                          {item.students.length} Pupil{item.students.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {meta?.description || "Targeted foundational drill required."}
                      </p>

                      {meta?.mappingNote && (
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/40 p-2.5 rounded-xl">
                          NIPUN Tag: {meta.mappingNote}
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-muted-foreground text-[11px]">Affected Students:</span>
                          {item.students.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedStudentDetail(s);
                                setActiveTab("students");
                              }}
                              className="font-medium bg-muted/80 hover:bg-primary/20 text-foreground px-2 py-0.5 rounded-full text-[11px] transition-colors"
                            >
                              {s.name.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: INTERVENTION CIRCLES */}
        {/* ========================================================================= */}
        {activeTab === "interventionCircles" && (
          <div className="glass-panel p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {language === "hi" ? "छोटे समूह सहायता चक्र (Support Circles)" : "Small-Group Support Circles (Interventions)"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Automatically clustered 2–4 student cohorts sharing identical skill gaps for focused remediation.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" />
                Print Support Sheets
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aggregatedGaps.map((group, idx) => {
                const meta = getGapType(group.gapTypeId);
                return (
                  <div
                    key={group.gapTypeId}
                    className="p-5 rounded-3xl border border-border bg-card space-y-4 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="label-overline block">Support Circle #{idx + 1}</span>
                        <h3 className="font-heading font-bold text-base text-foreground mt-0.5">
                          {language === "hi" && group.labelHi ? group.labelHi : group.label}
                        </h3>
                      </div>
                      <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px]">
                        {group.subject.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-secondary/15 rounded-2xl p-3.5 border border-border/60 text-xs space-y-2">
                      <span className="font-bold text-foreground block">
                        Assigned Cohort ({group.students.length} students):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {group.students.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentDetail(s);
                              setActiveTab("students");
                            }}
                            className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-full border border-border cursor-pointer hover:border-primary"
                          >
                            <StudentAvatar name={s.name} tint={s.avatarTint as AvatarTint} size="sm" />
                            <span className="font-medium text-foreground">{s.name} (Cl. {s.grade})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-muted-foreground">
                      <span className="font-bold text-foreground block">Pedagogical Remediation Plan:</span>
                      <p className="leading-relaxed">
                        {meta?.description || "Structured practice drill using tactile counters, flashcards, and paired reading."}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-4 bg-primary text-primary-foreground font-semibold gap-1.5"
                        onClick={() => handleBatchAllocateGroupWorksheets(group)}
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Allocate Worksheets to Entire Circle ({group.students.length})
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CLASSROOMS */}
        {activeTab === "classes" && (
          <div className="glass-panel p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {language === "hi" ? "संस्थागत कक्षाएं (School Classrooms)" : "Institutional Classrooms Overview"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tracking daily rotation pacing, reassessment intervals, and cohort gap counts.
                </p>
              </div>

              <Button
                size="sm"
                className="rounded-full text-xs h-9 px-4 bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
                onClick={handleOpenCreateClass}
              >
                <Plus className="h-3.5 w-3.5" />
                {language === "hi" ? "+ नई कक्षा जोड़ें" : "+ Create Classroom"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map((c) => {
                const classStudents = students.filter((s) => s.classId === c.id);
                const classGaps = learningGaps.filter(
                  (g) => g.status === "active" && classStudents.some((s) => s.id === g.studentId)
                );
                return (
                  <div key={c.id} className="p-5 rounded-3xl border border-border bg-card space-y-4 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="label-overline block">Classroom</span>
                          <h3 className="font-heading font-bold text-lg text-foreground mt-0.5">{c.name}</h3>
                        </div>
                        <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px]">
                          {(c as any).teacherLabel || c.gradeBand || "Primary Section"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div
                          onClick={() => {
                            setSelectedClassId(c.id);
                            setActiveTab("students");
                          }}
                          className="p-3 rounded-2xl bg-muted/40 cursor-pointer hover:bg-muted/70 transition-colors"
                        >
                          <span className="text-[10px] text-muted-foreground block">Enrolled Students</span>
                          <span className="font-heading font-bold text-base text-foreground">{classStudents.length} Pupils →</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-muted/40">
                          <span className="text-[10px] text-muted-foreground block">Active Skill Gaps</span>
                          <span className="font-heading font-bold text-base text-rose-700">{classGaps.length}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                        <div className="flex justify-between">
                          <span>Daily Assessment Pace:</span>
                          <span className="font-bold text-foreground">{c.studentsPerDay} students / day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reassessment Cycle:</span>
                          <span className="font-bold text-foreground">{c.reassessmentDays} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs h-8 px-3 border-border font-medium gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEditClass(c)}
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs h-8 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 font-medium gap-1"
                        onClick={() => handleDeleteClass(c.id, c.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: VISUAL ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytical Performance KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-4 space-y-1.5 shadow-2xs">
                <span className="label-overline">Remediation Mastery</span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
                  {activeGapsCount + resolvedGapsCount > 0
                    ? `${Math.round((resolvedGapsCount / (activeGapsCount + resolvedGapsCount)) * 100)}%`
                    : "100%"}
                </p>
                <p className="text-[11px] text-muted-foreground">{resolvedGapsCount} verified FLN remediations</p>
              </div>

              <div className="glass-panel p-4 space-y-1.5 shadow-2xs">
                <span className="label-overline">Active Intervention Load</span>
                <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-heading">
                  {activeGapsCount}
                </p>
                <p className="text-[11px] text-muted-foreground">FLN competency improvement needs</p>
              </div>

              <div className="glass-panel p-4 space-y-1.5 shadow-2xs">
                <span className="label-overline">Support Circles</span>
                <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-heading">
                  {aggregatedGaps.length}
                </p>
                <p className="text-[11px] text-muted-foreground">Homogeneous remedial peer groups</p>
              </div>

              <div className="glass-panel p-4 space-y-1.5 shadow-2xs">
                <span className="label-overline">Practice Intensity</span>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading">
                  {allocatedWorksheets.length}
                </p>
                <p className="text-[11px] text-muted-foreground">Differentiated drill sheets deployed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart: Subject Distribution */}
              <div className="glass-panel p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <PieChartIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-foreground">
                        {language === "hi" ? "FLN विषय वितरण" : "FLN Learning Gap Distribution"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Literacy vs. Numeracy balance</p>
                    </div>
                  </div>
                  <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono">
                    Subject Split
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {subjectDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomAnalyticsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Grade-wise Comparison */}
              <div className="glass-panel p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-foreground">
                        {language === "hi" ? "कक्षा-वार साक्षरता व संख्यात्मकता" : "Cohort Grade Breakdown"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Comparative needs across Classes 1–3</p>
                    </div>
                  </div>
                  <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono">
                    Grades 1–3
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                      <XAxis dataKey="grade" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomAnalyticsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="Reading" fill={CHART_COLORS.rose} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Numeracy" fill={CHART_COLORS.amber} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Resolved" fill={CHART_COLORS.emerald} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Common Gaps Horizontal Bar Chart */}
            <div className="glass-panel p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-foreground">
                      {language === "hi" ? "शीर्ष 6 सामान्य सीखने के अंतराल" : "Top Identified Competency Needs"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">High-density competencies for whole-class instruction</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  Aggregated across all classes
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCompetencyData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                    <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} width={180} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomAnalyticsTooltip />} />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} name="Affected Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: OFFLINE DATA IMPORT STATION & SYNC AUDIT */}
        {/* ========================================================================= */}
        {activeTab === "syncLogs" && (
          <div className="space-y-6">
            {/* Header & Overview */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Upload className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-foreground">
                      {language === "hi" ? "ऑफ़लाइन डेटा आयात स्टेशन" : "Offline Data Ingest Station"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {language === "hi"
                        ? "मोबाइल शिक्षक ऐप से एकत्रित ऑफ़लाइन रिकॉर्ड्स को केंद्रीय पोर्टल डेटाबेस में सुरक्षित रूप से आयात और विलय करें।"
                        : "Ingest student assessments, FLN learning gaps, and classrooms collected offline from mobile devices."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    onClick={exportAuditJSON}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {language === "hi" ? "ऑडिट निर्यात (JSON)" : "Export Audit (JSON)"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    onClick={fetchCentralData}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    {language === "hi" ? "ताज़ा करें" : "Refresh"}
                  </Button>
                </div>
              </div>

              {/* Status Message */}
              {importStatus && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                    importStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : importStatus.type === "error"
                      ? "bg-rose-50 text-rose-900 border-rose-200"
                      : "bg-blue-50 text-blue-900 border-blue-200"
                  }`}
                >
                  {importStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 font-medium">{importStatus.message}</div>
                  <button
                    onClick={() => setImportStatus(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Latest Sync Summary Banner */}
              {lastSyncSummary && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="font-bold text-emerald-900">
                        {language === "hi" ? "अंतिम सफल सिंक सारांश" : "Latest Sync Summary"}
                      </span>
                      <p className="text-[11px] text-emerald-700">
                        {lastSyncSummary.source} · {lastSyncSummary.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span><strong>{lastSyncSummary.totalStudents}</strong> {language === "hi" ? "विद्यार्थी" : "Students"}</span>
                    <span><strong>+{lastSyncSummary.addedStudents}</strong> {language === "hi" ? "नए" : "New"}</span>
                    <span><strong>{lastSyncSummary.gapsCount}</strong> {language === "hi" ? "अंतराल" : "Gaps"}</span>
                  </div>
                </div>
              )}

              {/* Ingestion Channels (3 methods) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Channel 1: Upload File */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-card transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <FileUp className="h-4 w-4" />
                      <span>{language === "hi" ? "विधि 1: JSON फ़ाइल अपलोड" : "Method 1: File Upload"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "hi"
                        ? "मोबाइल ऐप से डाउनलोड की गई 'sahayak_offline_data_*.json' फ़ाइल चुनें।"
                        : "Upload the .json offline bundle generated from the teacher mobile app."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full text-xs font-bold gap-1.5 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    {language === "hi" ? "फ़ाइल चुनें..." : "Select .JSON File..."}
                  </Button>
                </div>

                {/* Channel 2: 1-Click Local Vault Ingest */}
                <div className="p-4 rounded-2xl border border-border bg-card transition-all flex flex-col justify-between space-y-3 shadow-2xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                      <Smartphone className="h-4 w-4" />
                      <span>{language === "hi" ? "विधि 2: स्थानीय मोबाइल वॉल्ट" : "Method 2: Local Mobile Vault"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "hi"
                        ? "यदि मोबाइल ऐप इसी ब्राउज़र में उपयोग हुआ है, तो 1-क्लिक में स्थानीय डेटा लोड करें।"
                        : "Directly read data saved in this browser's encrypted mobile app vault."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full text-xs font-bold gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                    onClick={handleImportFromLocalApp}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    {language === "hi" ? "⚡ 1-क्लिक वॉल्ट सिंक" : "⚡ 1-Click Sync From Local Vault"}
                  </Button>
                </div>

                {/* Channel 3: Paste JSON Document */}
                <div className="p-4 rounded-2xl border border-border bg-card transition-all flex flex-col justify-between space-y-3 shadow-2xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-secondary font-bold text-xs">
                      <FileText className="h-4 w-4" />
                      <span>{language === "hi" ? "विधि 3: JSON टेक्स्ट पेस्ट" : "Method 3: Paste Raw JSON"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "hi"
                        ? "ऑफ़लाइन बैकअप या ऑडिट JSON को सीधे यहाँ पेस्ट करके इनगेस्ट करें।"
                        : "Paste raw JSON text from a WhatsApp message or external export."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder='Paste {"format": "sahayak-offline-bundle", ...}'
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background font-mono truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs px-3"
                      onClick={handleParsePastedJson}
                    >
                      Parse
                    </Button>
                  </div>
                </div>
              </div>

              {/* Staged Data Staging Inspector */}
              {parsedImportData && (
                <div className="mt-4 p-5 rounded-3xl border-2 border-primary/30 bg-primary/5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/20 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          📦 Staged Package: {importFileName || "Offline Data"}
                        </span>
                        <span className="badge-pill bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Validated & Ready
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Format: <span className="font-mono">{parsedImportData.format || "custom"}</span> · 
                        Source: <span className="font-mono">{parsedImportData.source || "file"}</span>
                        {parsedImportData.teacher?.name && ` · Teacher: ${parsedImportData.teacher.name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-full text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs px-4"
                        onClick={() => handleCommitImport()}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {language === "hi"
                          ? "केंद्रीय डेटाबेस में विलय करें (Commit Ingest)"
                          : "Commit & Ingest into Central Database"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs px-3"
                        onClick={() => {
                          setParsedImportData(null);
                          setImportFileName(null);
                        }}
                        disabled={isImporting}
                      >
                        <X className="h-3.5 w-3.5" />
                        {language === "hi" ? "रद्द करें" : "Cancel"}
                      </Button>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-card p-3 rounded-2xl border border-border flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg text-foreground">
                          {parsedImportData.students.length}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Students</div>
                      </div>
                    </div>

                    <div className="bg-card p-3 rounded-2xl border border-border flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg text-rose-600">
                          {parsedImportData.learningGaps.length}
                        </div>
                        <div className="text-[11px] text-muted-foreground">FLN Learning Gaps</div>
                      </div>
                    </div>

                    <div className="bg-card p-3 rounded-2xl border border-border flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                        <School className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg text-secondary">
                          {parsedImportData.classes.length}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Classrooms</div>
                      </div>
                    </div>

                    <div className="bg-card p-3 rounded-2xl border border-border flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg text-amber-600">
                          {parsedImportData.worksheets.length}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Worksheets</div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table of Incoming Students & Gaps */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-foreground block">
                      Incoming Students Preview ({Math.min(parsedImportData.students.length, 6)} of {parsedImportData.students.length}):
                    </span>
                    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-muted/40 font-mono text-[10px] text-muted-foreground uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Roll No</th>
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Grade</th>
                            <th className="py-2.5 px-3">Detected Gaps</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedImportData.students.slice(0, 6).map((s) => {
                            const studentGaps = parsedImportData.learningGaps.filter((g) => g.studentId === s.id);
                            return (
                              <tr key={s.id} className="hover:bg-muted/30 font-sans text-xs">
                                <td className="py-2 px-3 font-mono text-muted-foreground">#{s.rollNo}</td>
                                <td className="py-2 px-3 font-bold text-foreground">{s.name}</td>
                                <td className="py-2 px-3">Class {s.grade}</td>
                                <td className="py-2 px-3">
                                  {studentGaps.length === 0 ? (
                                    <span className="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                                      On Track
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {studentGaps.map((g) => (
                                        <span
                                          key={g.id}
                                          className={`badge-pill text-[9px] ${
                                            g.subject === "reading"
                                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                                              : "bg-amber-50 text-amber-800 border border-amber-200"
                                          }`}
                                        >
                                          {getGapType(g.gapTypeId)?.label || g.gapTypeId} (T{g.currentTier})
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px]">
                                    Ready to Merge
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Audit & Ingestion Log Table */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {language === "hi" ? "सिंक ऑडिट ट्रांजैक्शन्स एवं लॉग स्ट्रीम" : "Sync Audit & Ingestion Stream"}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {syncLogs.length} total events logged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Timestamp</th>
                      <th className="py-3 px-3">Operation</th>
                      <th className="py-3 px-3">Entity</th>
                      <th className="py-3 px-3">Entity ID / Batch Details</th>
                      <th className="py-3 px-3">Version</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {syncLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                          No ingest transactions recorded yet. Use the offline file import above or click &quot;Seed FLN Demo Data&quot;.
                        </td>
                      </tr>
                    ) : (
                      syncLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/40 font-mono text-[11px]">
                          <td className="py-2.5 px-3 text-muted-foreground">{formatShortDate(log.receivedAt)}</td>
                          <td className="py-2.5 px-3 font-bold text-primary">[{log.operation}]</td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">{log.entityType}</td>
                          <td className="py-2.5 px-3 text-muted-foreground truncate max-w-sm">
                            {log.details || log.entityId}
                          </td>
                          <td className="py-2.5 px-3">v{log.serverVersion}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: REPORTS & EXPORTS */}
        {activeTab === "reports" && (
          <div className="glass-panel p-6 space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">
                {language === "hi" ? "संस्थागत FLN रिपोर्ट एवं डेटा निर्यात" : "FLN Reports & Data Exports"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Generate official Foundational Literacy & Numeracy reporting summaries and download raw datasets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl border border-border bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  Student Master Roster
                </div>
                <p className="text-xs text-muted-foreground">
                  Full student CSV with roll numbers, enrolled grades, avatar tints, and active gap counts.
                </p>
                <Button
                  onClick={exportStudentsCSV}
                  className="w-full rounded-full text-xs font-semibold gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Student Roster (CSV)
                </Button>
              </div>

              <div className="p-5 rounded-3xl border border-border bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  Learning Gaps Registry
                </div>
                <p className="text-xs text-muted-foreground">
                  Comprehensive CSV of all active and resolved learning gaps with detection dates and tier levels.
                </p>
                <Button
                  onClick={exportGapsCSV}
                  variant="outline"
                  className="w-full rounded-full text-xs font-semibold gap-1.5 border-border"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Gaps Summary (CSV)
                </Button>
              </div>

              <div className="p-5 rounded-3xl border border-border bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <FileText className="h-4 w-4" />
                  Full System Audit Bundle
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete JSON backup of classrooms, students, assessments, skill gaps, and sync transactions.
                </p>
                <Button
                  onClick={exportAuditJSON}
                  variant="outline"
                  className="w-full rounded-full text-xs font-semibold gap-1.5 border-border"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Full Audit (JSON)
                </Button>
              </div>
            </div>

            {/* Printable Institutional Summary */}
            <div className="border border-border rounded-3xl p-6 bg-secondary/15 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    FLN Institutional Assessment Summary Card
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Formal report card format for Block Education Officers (BEOs) and School Inspectors.
                  </p>
                </div>
                <Button
                  onClick={() => window.print()}
                  className="rounded-full text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Official FLN Summary
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-card rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px]">Total Enrollment</span>
                  <span className="font-heading font-bold text-lg text-foreground">{students.length} Pupils</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px]">Active Reading Gaps</span>
                  <span className="font-heading font-bold text-lg text-rose-700">{readingGapsCount} Identified</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px]">Active Numeracy Gaps</span>
                  <span className="font-heading font-bold text-lg text-amber-700">{numeracyGapsCount} Identified</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border">
                  <span className="text-muted-foreground block text-[10px]">Remediation Rate</span>
                  <span className="font-heading font-bold text-lg text-emerald-700">
                    {learningGaps.length > 0
                      ? Math.round((resolvedGapsCount / learningGaps.length) * 100)
                      : 100}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 10: WORKFLOW & PEDAGOGY */}
        {/* ========================================================================= */}
        {activeTab === "workflow" && (
          <div className="glass-panel p-6 space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">
                {language === "hi" ? "सहायक (Sahayak) कार्यप्रणाली एवं शैक्षणिक आधार" : "Pedagogical Architecture & Workflow"}
              </h2>
              <p className="text-xs text-muted-foreground">
                How Sahayak powers stress-free foundational literacy and numeracy diagnostics for primary classrooms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    1. The 5-Students-per-Day Rolling Queue
                  </h3>
                  <p>
                    Rather than halting classroom instruction for high-stakes exams, teachers assess 5 students per day in 1-minute 1-on-1 micro-sessions. A standard class of 30–40 pupils is continuously diagnosed every 7–14 school days.
                  </p>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    2. Observable Token-Tag Rule Engine
                  </h3>
                  <p>
                    Instead of opaque ML or competitive rankings, Sahayak records observable child responses (e.g. hesitation on decade numbers, letter swaps between &apos;b&apos; and &apos;d&apos;). Gaps are matched to deterministic NIPUN Bharat competency targets.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-amber-600" />
                    3. Tiered Worksheet & Remediation Bank
                  </h3>
                  <p>
                    Diagnosed gaps automatically generate tiered practice material: Tier 1 (Concrete & Foundational), Tier 2 (Intermediate decoding), and Tier 3 (Fluency & Application), ensuring students master prerequisites before progressing.
                  </p>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-600" />
                    4. Zero-PII Offline Vault & Cloud Gateway
                  </h3>
                  <p>
                    Full assessment and worksheet generation operate offline in browser IndexedDB with AES-GCM encryption. When internet connectivity is available, anonymized aggregates and mutation batches synchronize with Supabase PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: INDIVIDUAL STUDENT DOSSIER & NEEDS MANAGER */}
      {/* ========================================================================= */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3.5">
                <StudentAvatar
                  name={selectedStudentDetail.name}
                  tint={selectedStudentDetail.avatarTint as AvatarTint}
                  size="lg"
                />
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground">
                    {selectedStudentDetail.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Class {selectedStudentDetail.grade} · Roll #{selectedStudentDetail.rollNo} ·{" "}
                    {classes.find((c) => c.id === selectedStudentDetail.classId)?.name || "Primary Section"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-8 px-3 gap-1"
                  onClick={() => handleOpenEditStudent(selectedStudentDetail)}
                >
                  <Edit2 className="h-3 w-3" />
                  Edit Profile
                </Button>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-full text-sm font-mono hover:bg-muted"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                onClick={() => setStudentModalTab("needs")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  studentModalTab === "needs"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Improvement Needs ({learningGaps.filter((g) => g.studentId === selectedStudentDetail.id && g.status === "active").length})
              </button>
              <button
                onClick={() => setStudentModalTab("sheets")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  studentModalTab === "sheets"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Allocated Practice Sheets ({allocatedWorksheets.filter((w) => w.studentId === selectedStudentDetail.id).length})
              </button>
              <button
                onClick={() => setStudentModalTab("history")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  studentModalTab === "history"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Resolved Gaps History ({learningGaps.filter((g) => g.studentId === selectedStudentDetail.id && g.status === "resolved").length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* TAB A: IMPROVEMENT NEEDS */}
              {studentModalTab === "needs" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Active Foundational Skill Gaps Requiring Remediation:
                    </span>
                    <Button
                      size="sm"
                      className="rounded-full text-xs h-7 px-3 bg-primary text-primary-foreground font-semibold gap-1"
                      onClick={() => handleOpenAssignGapModal(selectedStudentDetail)}
                    >
                      <Plus className="h-3 w-3" />
                      Assign New Gap
                    </Button>
                  </div>

                  {learningGaps.filter((g) => g.studentId === selectedStudentDetail.id && g.status === "active").length === 0 ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <p className="font-bold">✓ Student is On Track!</p>
                      <p className="text-[11px] text-emerald-800">
                        No active foundational literacy or numeracy gaps recorded for {selectedStudentDetail.name}.
                      </p>
                    </div>
                  ) : (
                    learningGaps
                      .filter((g) => g.studentId === selectedStudentDetail.id && g.status === "active")
                      .map((gap) => {
                        const meta = getGapType(gap.gapTypeId);
                        return (
                          <div
                            key={gap.id}
                            className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`badge-pill text-[9px] ${
                                      gap.subject === "reading"
                                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                                        : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}
                                  >
                                    {gap.subject.toUpperCase()}
                                  </span>
                                  <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold">
                                    TIER {gap.currentTier || 1}
                                  </span>
                                </div>
                                <h4 className="font-heading font-bold text-sm text-foreground mt-1">
                                  {language === "hi" && meta?.labelHi ? meta.labelHi : meta?.label || gap.gapTypeId}
                                </h4>
                              </div>

                              <span className="text-[10px] text-muted-foreground font-mono">
                                Detected: {gap.firstDetectedAt ? formatShortDate(gap.firstDetectedAt) : "Recent"}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {language === "hi" && meta?.descriptionHi ? meta.descriptionHi : meta?.description}
                            </p>

                            {/* Gap Action Buttons */}
                            <div className="pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                              <Button
                                size="sm"
                                className="rounded-full text-xs h-7 px-3 bg-primary text-primary-foreground font-semibold gap-1"
                                onClick={() => handleAllocateWorksheet(selectedStudentDetail, gap.gapTypeId, (gap.currentTier || 1) as WorksheetTier)}
                              >
                                <ClipboardList className="h-3 w-3" />
                                Allocate Practice Sheet (Tier {gap.currentTier || 1})
                              </Button>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full text-xs h-7 px-2.5 border-border font-medium"
                                  onClick={() => handleEscalateTier(gap)}
                                  title="Escalate difficulty to next drill tier"
                                >
                                  ⚡ Next Tier
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full text-xs h-7 px-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold gap-1"
                                  onClick={() => handleResolveGap(gap.id)}
                                >
                                  <Check className="h-3 w-3" />
                                  Mark Resolved
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* TAB B: ALLOCATED PRACTICE SHEETS */}
              {studentModalTab === "sheets" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Allocated Worksheets & Practice Assignments:
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-7 px-3 border-border font-medium"
                      onClick={() => setActiveTab("worksheets")}
                    >
                      Browse All Templates →
                    </Button>
                  </div>

                  {allocatedWorksheets.filter((w) => w.studentId === selectedStudentDetail.id).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center text-xs text-muted-foreground space-y-2">
                      <p>No practice worksheets allocated yet for this student.</p>
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-7 px-3"
                        onClick={() => {
                          const activeGaps = learningGaps.filter(
                            (g) => g.studentId === selectedStudentDetail.id && g.status === "active"
                          );
                          const gapType = activeGaps[0]?.gapTypeId || "letter-sound-bd";
                          handleAllocateWorksheet(selectedStudentDetail, gapType, 1, true);
                        }}
                      >
                        + Generate First Practice Sheet
                      </Button>
                    </div>
                  ) : (
                    allocatedWorksheets
                      .filter((w) => w.studentId === selectedStudentDetail.id)
                      .map((ws) => (
                        <div
                          key={ws.id}
                          className="p-4 rounded-2xl border border-border bg-card space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold">
                                  TIER {ws.tier}
                                </span>
                                <span
                                  className={`badge-pill text-[9px] ${
                                    ws.status === "practiced"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {ws.status === "practiced" ? "✓ Practiced / Completed" : "Assigned"}
                                </span>
                              </div>
                              <h4 className="font-heading font-bold text-sm text-foreground mt-1">
                                {ws.title}
                              </h4>
                            </div>

                            <span className="text-[10px] font-mono text-muted-foreground">
                              {formatShortDate(ws.assignedAt)}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">{ws.focus}</p>

                          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs h-7 px-3 border-border font-medium gap-1"
                              onClick={() => setPreviewWorksheet(ws)}
                            >
                              <Eye className="h-3 w-3" />
                              Preview & Print
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs h-7 px-2.5 text-primary hover:bg-primary/10 font-semibold"
                              onClick={() => handleMarkWorksheetPracticed(ws.id)}
                            >
                              {ws.status === "practiced" ? "Mark Unpracticed" : "Mark Practiced"}
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* TAB C: RESOLVED GAPS HISTORY */}
              {studentModalTab === "history" && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-foreground">
                    Remediated Learning Gap History:
                  </span>

                  {learningGaps.filter((g) => g.studentId === selectedStudentDetail.id && g.status === "resolved").length === 0 ? (
                    <p className="p-4 rounded-2xl bg-muted/40 text-center text-xs text-muted-foreground italic">
                      No past resolved gaps recorded for this student yet.
                    </p>
                  ) : (
                    learningGaps
                      .filter((g) => g.studentId === selectedStudentDetail.id && g.status === "resolved")
                      .map((gap) => {
                        const meta = getGapType(gap.gapTypeId);
                        return (
                          <div
                            key={gap.id}
                            className="p-3.5 rounded-2xl border border-border bg-emerald-50/40 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{meta?.label || gap.gapTypeId}</span>
                              <span className="badge-pill bg-emerald-100 text-emerald-900 text-[9px] font-bold">
                                ✓ RESOLVED
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              Resolved: {gap.resolvedAt ? formatShortDate(gap.resolvedAt) : "Completed"}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-[11px] font-mono text-muted-foreground">
                Student ID: {selectedStudentDetail.id}
              </span>
              <Button
                onClick={() => setSelectedStudentDetail(null)}
                className="rounded-full text-xs px-5"
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT STUDENT FORM */}
      {/* ========================================================================= */}
      {isCreateStudentOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStudent}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                {editingStudent ? "Edit Student Profile" : "Enroll New Student"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateStudentOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-foreground block">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                />
              </div>

              {/* Grade & Roll */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Grade / Class *</label>
                  <select
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: Number(e.target.value) as Grade })}
                  >
                    <option value={1}>Class 1 (Grade 1)</option>
                    <option value={2}>Class 2 (Grade 2)</option>
                    <option value={3}>Class 3 (Grade 3)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05"
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  />
                </div>
              </div>

              {/* Classroom */}
              <div className="space-y-1">
                <label className="font-bold text-foreground block">Assigned Classroom</label>
                <select
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={studentForm.classId}
                  onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({(c as any).teacherLabel || c.gradeBand || "Primary"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Tint */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Avatar Theme Tint</label>
                <div className="flex items-center gap-2">
                  {(["teal", "coral", "yellow", "lilac"] as AvatarTint[]).map((tint) => (
                    <button
                      key={tint}
                      type="button"
                      onClick={() => setStudentForm({ ...studentForm, avatarTint: tint })}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold capitalize transition-all ${
                        studentForm.avatarTint === tint
                          ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {tint}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs px-4"
                onClick={() => setIsCreateStudentOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold"
              >
                {editingStudent ? "Save Changes" : "Enroll Student"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN NEW LEARNING GAP */}
      {/* ========================================================================= */}
      {isAssignGapOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignNewGap}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Assign Learning Gap & Worksheet
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignGapOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground block">Competency Gap Category *</label>
                <select
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={assignGapForm.gapTypeId}
                  onChange={(e) => setAssignGapForm({ ...assignGapForm, gapTypeId: e.target.value })}
                >
                  {getAllGapTypes().map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.subject.toUpperCase()}] {g.label} (Grades: {g.grades.join(",")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground block">Initial Practice Tier</label>
                <select
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={assignGapForm.tier}
                  onChange={(e) => setAssignGapForm({ ...assignGapForm, tier: Number(e.target.value) as WorksheetTier })}
                >
                  <option value={1}>Tier 1 — Foundational (Concrete / Picture support)</option>
                  <option value={2}>Tier 2 — Intermediate (Word & Sentence decoding)</option>
                  <option value={3}>Tier 3 — Fluency (Rapid recall & Application)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs px-4"
                onClick={() => setIsAssignGapOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold"
              >
                Assign & Generate Sheet
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INTERACTIVE WORKSHEET PREVIEW & PRINT */}
      {/* ========================================================================= */}
      {previewWorksheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-border pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Printable Practice Worksheet Preview
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="rounded-full text-xs h-8 px-4 bg-primary text-primary-foreground font-semibold gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Worksheet (A4)
                </Button>

                <button
                  onClick={() => setPreviewWorksheet(null)}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-full text-sm font-mono hover:bg-muted"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Printable Worksheet Document */}
            <div className="flex-1 overflow-y-auto p-6 rounded-2xl border-2 border-dashed border-border bg-white text-slate-900 space-y-5 font-sans">
              {/* Worksheet Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                    SAHAYAK FOUNDATIONAL PRACTICE
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Classes 1–3 Remedial Literacy & Numeracy Skill Sheet
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block border-2 border-slate-900 px-3 py-1 font-mono font-bold text-xs uppercase">
                    TIER {previewWorksheet.tier} DRILL
                  </span>
                </div>
              </div>

              {/* Student Metadata Box */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">STUDENT NAME:</span>
                  <span className="font-bold text-slate-900">
                    {students.find((s) => s.id === previewWorksheet.studentId)?.name || "Class Pupil"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CLASS / ROLL:</span>
                  <span className="font-bold text-slate-900">
                    Class {students.find((s) => s.id === previewWorksheet.studentId)?.grade || 1} · #
                    {students.find((s) => s.id === previewWorksheet.studentId)?.rollNo || "01"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DATE ALLOCATED:</span>
                  <span className="font-bold text-slate-900">
                    {formatShortDate(previewWorksheet.assignedAt)}
                  </span>
                </div>
              </div>

              {/* Title & Focus Box */}
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {previewWorksheet.title}
                </h3>
                <p className="text-xs text-slate-700 font-medium italic">
                  Pedagogical Focus: {previewWorksheet.focus}
                </p>
              </div>

              {/* Questions List */}
              <div className="space-y-3.5 pt-2">
                {previewWorksheet.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <span>{item.prompt}</span>
                    </div>

                    {/* Practice Writing Area / Blank Box */}
                    <div className="h-12 border-b border-dashed border-slate-400 mt-2 flex items-end justify-between px-2 text-[10px] text-slate-400 font-mono">
                      <span>Response / Tracing Area</span>
                      <span>[ Teacher Check: ___ / 1 ]</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Teacher Assessment Footer */}
              <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">TEACHER OBSERVATION / NOTES:</span>
                  <div className="h-10 border-b border-slate-300"></div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">OUTCOME VERIFICATION:</span>
                  <div className="flex justify-end gap-3 pt-1 text-[11px] font-bold">
                    <span>[ ] Remediated</span>
                    <span>[ ] Advance Tier</span>
                    <span>[ ] Repeat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-between items-center print:hidden">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setPreviewWorksheet(null)}
              >
                Close Preview
              </Button>

              <Button
                size="sm"
                className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" />
                Print Worksheet
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: CREATE / EDIT CLASSROOM FORM */}
      {/* ========================================================================= */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveClass}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                {editingClass ? "Edit Classroom Section" : "Create New Classroom"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Classroom Name */}
              <div className="space-y-1">
                <label className="font-bold text-foreground block">Classroom / Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 1B — Sunflower Section"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                />
              </div>

              {/* Grade Band & Teacher */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Grade Band *</label>
                  <select
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={classForm.gradeBand}
                    onChange={(e) => setClassForm({ ...classForm, gradeBand: e.target.value })}
                  >
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Classes 1–3 Multi-Grade">Classes 1–3 Multi-Grade</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Class Teacher</label>
                  <input
                    type="text"
                    placeholder="e.g. Prerna Sharma"
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={classForm.teacherLabel}
                    onChange={(e) => setClassForm({ ...classForm, teacherLabel: e.target.value })}
                  />
                </div>
              </div>

              {/* Pacing Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Daily Assessment Pace</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      value={classForm.studentsPerDay}
                      onChange={(e) => setClassForm({ ...classForm, studentsPerDay: Number(e.target.value) })}
                    />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">pupils/day</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Reassessment Interval</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={7}
                      max={60}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      value={classForm.reassessmentDays}
                      onChange={(e) => setClassForm({ ...classForm, reassessmentDays: Number(e.target.value) })}
                    />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">days</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs px-4"
                onClick={() => setIsCreateClassOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold"
              >
                {editingClass ? "Save Classroom" : "Create Classroom"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ALLOCATE WORKSHEET TO PUPIL */}
      {/* ========================================================================= */}
      {isAllocateWorksheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmAllocateFromModal}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                {language === "hi" ? "विद्यार्थी को अभ्यास पत्रक आबंटित करें" : "Allocate Worksheet to Pupil"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAllocateWorksheetModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground block">Select Pupil *</label>
                <select
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  value={allocateModalStudentId}
                  onChange={(e) => setAllocateModalStudentId(e.target.value)}
                >
                  {students.map((s) => {
                    const c = classes.find((cl) => cl.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll #{s.rollNo} · Class {s.grade} - {c?.name || "Classroom"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground block">Select Worksheet Drill Template *</label>
                <select
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  value={allocateModalTemplateId}
                  onChange={(e) => setAllocateModalTemplateId(e.target.value)}
                >
                  {WORKSHEET_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.subject.toUpperCase()} · TIER {t.tier}] {t.title} (Grades: {t.grades.join(",")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Box of selected template */}
              {(() => {
                const selectedTmpl = WORKSHEET_TEMPLATES.find((t) => t.id === allocateModalTemplateId);
                if (!selectedTmpl) return null;
                return (
                  <div className="p-3 bg-muted/40 rounded-2xl border border-border space-y-1 text-xs">
                    <span className="font-bold text-foreground block">
                      Focus: {selectedTmpl.focus}
                    </span>
                    <span className="text-[11px] text-muted-foreground block font-mono">
                      Includes {selectedTmpl.items.length} guided practice exercises
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs px-4"
                onClick={() => setIsAllocateWorksheetModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Allocate Now
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sahayak (SAH-PS-2) — Teacher Management & Practice Allocation Platform</span>
          <span className="font-mono text-[11px]">NIPUN Bharat Aligned · Offline First</span>
        </div>
      </footer>
    </div>
  );
}
