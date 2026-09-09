import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
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
  primary: "#4f5bd5",
  secondary: "#8b5cf6",
  rose: "#f43f5e",
  amber: "#f59e0b",
  emerald: "#10b981",
  indigo: "#6366f1",
  teal: "#0d9488",
  coral: "#f97316",
};

export default function CentralPortal() {
  const { language, setLanguage, reloadDemo, snapshot } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // Central Database entities
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<StudentEntity[]>([]);
  const [learningGaps, setLearningGaps] = useState<LearningGapEntity[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [allocatedWorksheets, setAllocatedWorksheets] = useState<WorksheetInstance[]>([]);
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

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "students"
    | "gaps"
    | "worksheets"
    | "interventionCircles"
    | "classes"
    | "analytics"
    | "syncLogs"
    | "reports"
    | "workflow"
  >("overview");

  // Interactive Modals & Drawers
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentEntity | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<"needs" | "sheets" | "history">("needs");
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentEntity | null>(null);
  const [isAssignGapOpen, setIsAssignGapOpen] = useState(false);
  const [previewWorksheet, setPreviewWorksheet] = useState<WorksheetInstance | null>(null);

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

  const showNotification = (text: string, type: "success" | "info" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  // Fetch central database records from backend REST API
  const fetchCentralData = async () => {
    try {
      setRefreshing(true);
      const [classRes, studentRes, gapRes, logRes, sbRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/students"),
        fetch("/api/learning-gaps"),
        fetch("/api/sync/logs"),
        fetch("/api/supabase/status"),
      ]);

      if (classRes.ok) {
        const d = await classRes.json();
        setClasses(d.data || []);
      }
      if (studentRes.ok) {
        const d = await studentRes.json();
        setStudents(d.data || []);
      }
      if (gapRes.ok) {
        const d = await gapRes.json();
        setLearningGaps(d.data || []);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setSyncLogs(d.data || []);
      }
      if (sbRes.ok) {
        const sb = await sbRes.json();
        setSupabaseStatus(sb);
      }
    } catch (e) {
      console.error("Failed to fetch central data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showNotification(
          language === "hi"
            ? "कक्षा 1–3 का बुनियादी साक्षरता और संख्यात्मकता डेमो डेटा लोड हो गया!"
            : data.message || "Seeded FLN demo data successfully!"
        );
        await reloadDemo();
        await fetchCentralData();
      }
    } catch (err) {
      console.error("Failed to seed demo data:", err);
      showNotification("Failed to seed demo data", "error");
    } finally {
      setSeeding(false);
    }
  };

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

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const savedEntity: StudentEntity = data.data;

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
      }
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
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        setLearningGaps((prev) => prev.filter((g) => g.studentId !== studentId));
        setAllocatedWorksheets((prev) => prev.filter((w) => w.studentId !== studentId));
        if (selectedStudentDetail?.id === studentId) {
          setSelectedStudentDetail(null);
        }
        showNotification(language === "hi" ? "विद्यार्थी रिकॉर्ड हटाया गया" : "Student record removed");
      }
    } catch (err) {
      console.error("Failed to delete student:", err);
      showNotification("Failed to delete student", "error");
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

      const res = await fetch("/api/learning-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const res = await fetch("/api/learning-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const res = await fetch("/api/learning-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-2xs">
              <BookOpen className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-bold text-lg text-foreground tracking-tight">
                  {language === "hi" ? "सहायक केंद्रीय वेब पोर्टल" : "Sahayak Central Web Portal"}
                </span>
                <span
                  className={`badge-pill text-[10px] ${
                    supabaseStatus?.connected
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      supabaseStatus?.connected ? "bg-emerald-500" : "bg-primary"
                    } animate-pulse`}
                  />
                  {supabaseStatus?.connected
                    ? language === "hi"
                      ? "सुपाबेस क्लाउड कनेक्टेड"
                      : "Supabase Cloud Connected"
                    : language === "hi"
                    ? "स्थानीय वॉल्ट + सुपाबेस"
                    : "Local Vault + Supabase SDK"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "hi"
                  ? "कक्षा 1–3 बुनियादी साक्षरता एवं संख्यात्मकता (FLN) शिक्षक प्रबंधन एवं अभ्यास पत्रक केंद्र"
                  : "Classes 1–3 Foundational Literacy & Numeracy (FLN) Teacher Management & Practice Hub"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Switcher */}
            <div
              role="group"
              aria-label="Language"
              className="flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5"
            >
              <LangButton active={language === "en"} onClick={() => setLanguage("en")}>
                EN
              </LangButton>
              <LangButton active={language === "hi"} onClick={() => setLanguage("hi")}>
                हिंदी
              </LangButton>
            </div>

            {/* Add Student Quick Button */}
            <Button
              size="sm"
              className="rounded-full text-xs h-9 px-3.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gap-1.5 shadow-xs"
              onClick={handleOpenCreateStudent}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {language === "hi" ? "+ नया विद्यार्थी जोड़ें" : "+ Enroll Student"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-9 px-3.5 border-border bg-card hover:bg-muted font-semibold text-foreground gap-1.5"
              onClick={handleSeedDemoData}
              disabled={seeding}
            >
              <Sparkles className={`h-3.5 w-3.5 text-amber-600 ${seeding ? "animate-spin" : ""}`} />
              {seeding
                ? language === "hi"
                  ? "डेटा लोड हो रहा है..."
                  : "Seeding Data..."
                : language === "hi"
                ? "FLN डेमो डेटा"
                : "Seed FLN Demo Data"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-9 px-3 border-border bg-card hover:bg-muted font-medium"
              onClick={fetchCentralData}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-primary ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-soft transition-all"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "मोबाइल ऐप" : "Teacher Mobile App"}</span>
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-80" />
            </Link>
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div
            onClick={() => setActiveTab("students")}
            className="glass-panel p-4 space-y-1 cursor-pointer hover:border-primary/50 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="label-overline">Students</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{students.length}</p>
            <span className="text-[10px] text-muted-foreground">Enrolled Pupils →</span>
          </div>

          <div
            onClick={() => {
              setGapSubjectFilter("reading");
              setActiveTab("gaps");
            }}
            className="glass-panel p-4 space-y-1 cursor-pointer hover:border-rose-300 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="label-overline">Reading Gaps</span>
              <BookOpen className="h-4 w-4 text-rose-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-rose-700">{readingGapsCount}</p>
            <span className="text-[10px] text-muted-foreground">Phonics & Blends →</span>
          </div>

          <div
            onClick={() => {
              setGapSubjectFilter("numeracy");
              setActiveTab("gaps");
            }}
            className="glass-panel p-4 space-y-1 cursor-pointer hover:border-amber-300 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="label-overline">Numeracy Gaps</span>
              <Calculator className="h-4 w-4 text-amber-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-amber-700">{numeracyGapsCount}</p>
            <span className="text-[10px] text-muted-foreground">Decades & Place Value →</span>
          </div>

          <div
            onClick={() => setActiveTab("worksheets")}
            className="glass-panel p-4 space-y-1 cursor-pointer hover:border-secondary/50 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="label-overline">Practice Sheets</span>
              <ClipboardList className="h-4 w-4 text-secondary" />
            </div>
            <p className="font-heading text-2xl font-bold text-secondary">{allocatedWorksheets.length}</p>
            <span className="text-[10px] text-muted-foreground">Allocated Drills →</span>
          </div>

          <div className="glass-panel p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="label-overline">Resolved Gaps</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-emerald-700">{resolvedGapsCount}</p>
            <span className="text-[10px] text-muted-foreground">Remediated & Verified</span>
          </div>

          <div
            onClick={() => setActiveTab("syncLogs")}
            className="glass-panel p-4 space-y-1 cursor-pointer hover:border-primary/50 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="label-overline">Sync Status</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="font-heading text-sm font-bold text-foreground mt-1 truncate">
              {supabaseStatus?.connected ? "Cloud Sync Active" : "Local Vault"}
            </p>
            <span className="text-[10px] text-muted-foreground">{syncedCount} sync events →</span>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-border pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            {language === "hi" ? "सिंहावलोकन" : "Overview"}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "students"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {language === "hi" ? "विद्यार्थी प्रबंधन एवं जरूरतें" : "Student Profiles & Needs"} ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("worksheets")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "worksheets"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {language === "hi" ? "अभ्यास पत्रक आवंटन बैंक" : "Worksheet Bank & Allocation"}
          </button>
          <button
            onClick={() => setActiveTab("gaps")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "gaps"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {language === "hi" ? "कौशल अंतराल मैट्रिक्स" : "Skill Gaps Matrix"} ({activeGapsCount})
          </button>
          <button
            onClick={() => setActiveTab("interventionCircles")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "interventionCircles"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {language === "hi" ? "सहायता समूह (Interventions)" : "Intervention Circles"} ({aggregatedGaps.length})
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === "classes"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            {language === "hi" ? "कक्षाएं (Classrooms)" : "Classrooms"} ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {language === "hi" ? "विजुअल एनालिटिक्स" : "Visual Analytics"}
          </button>
          <button
            onClick={() => setActiveTab("syncLogs")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "syncLogs"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <FolderSync className="h-3.5 w-3.5" />
            {language === "hi" ? "सिंक ऑडिट लॉग्स" : "Sync Stream"} ({syncLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {language === "hi" ? "रिपोर्ट्स और निर्यात" : "Reports & Export"}
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "workflow"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {language === "hi" ? "कार्यप्रणाली" : "How It Works"}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Teacher Pipeline Banner */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <h2 className="font-heading font-bold text-lg text-foreground">
                      {language === "hi"
                        ? "शिक्षक मोबाइल PWA $\\to$ केंद्रीय प्रबंधन पाइपलाइन"
                        : "Teacher Mobile PWA $\\to$ Central Management Pipeline"}
                    </h2>
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

                {/* 3 Quick Action Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div
                    onClick={() => setActiveTab("students")}
                    className="p-3.5 rounded-2xl bg-secondary/15 border border-border space-y-1.5 cursor-pointer hover:border-secondary transition-all"
                  >
                    <span className="text-[10px] font-mono font-bold text-secondary block">STEP 1</span>
                    <p className="font-bold text-xs text-foreground">Individual Diagnosis</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Inspect specific student gaps (b/d confusion, decade transitions).
                    </p>
                  </div>
                  <div
                    onClick={() => setActiveTab("worksheets")}
                    className="p-3.5 rounded-2xl bg-primary/10 border border-border space-y-1.5 cursor-pointer hover:border-primary transition-all"
                  >
                    <span className="text-[10px] font-mono font-bold text-primary block">STEP 2</span>
                    <p className="font-bold text-xs text-foreground">Allocate Practice Sheet</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      1-click generate Tier 1–3 tailored drill sheets for the child.
                    </p>
                  </div>
                  <div
                    onClick={() => setActiveTab("interventionCircles")}
                    className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 space-y-1.5 cursor-pointer hover:border-amber-400 transition-all"
                  >
                    <span className="text-[10px] font-mono font-bold text-amber-700 block">STEP 3</span>
                    <p className="font-bold text-xs text-foreground">Support Circles</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Group students with identical needs for 10-min remedial practice.
                    </p>
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

            {/* Right Column: Live Stream & Summary */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {language === "hi" ? "लाइव इनगेस्ट स्ट्रीम" : "Live Sync Ingest"}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {syncLogs.length} events
                </span>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {syncLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">
                    No transactions received yet. Click &quot;Seed FLN Demo Data&quot; or sync from the mobile app.
                  </p>
                ) : (
                  syncLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl border border-border bg-card text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold uppercase text-primary text-[10px]">
                          [{log.operation}] {log.entityType}
                        </span>
                        <span className="badge-pill text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                          v{log.serverVersion} · {log.status}
                        </span>
                      </div>
                      <p className="text-foreground font-mono text-[11px] truncate">
                        UUID: {log.entityId}
                      </p>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {formatShortDate(log.receivedAt)}
                      </span>
                    </div>
                  ))
                )}
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
                                  <span className="font-bold text-sm block">{s.name}</span>
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
        {/* TAB 3: WORKSHEET BANK & ALLOCATION CENTER */}
        {/* ========================================================================= */}
        {activeTab === "worksheets" && (
          <div className="glass-panel p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {language === "hi" ? "लक्षित अभ्यास पत्रक बैंक एवं आबंटन केंद्र" : "Targeted Practice Worksheet Bank & Allocation"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pre-built tiered practice templates matched to diagnosed gaps. Allocate directly to pupils or support circles.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Active Worksheets
                </Button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORKSHEET_TEMPLATES.map((tmpl) => {
                const meta = getGapType(tmpl.gapTypeId);
                return (
                  <div
                    key={tmpl.id}
                    className="p-5 rounded-3xl border border-border bg-card space-y-3.5 shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`badge-pill text-[9px] ${
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

                      <div className="p-2.5 rounded-xl bg-muted/40 text-[11px] text-foreground space-y-1 font-mono">
                        <span className="text-[10px] text-muted-foreground block font-sans font-bold">
                          Sample Exercise ({tmpl.items.length} items):
                        </span>
                        <p className="truncate">
                          1. {language === "hi" && tmpl.itemsHi ? tmpl.itemsHi[0]?.prompt : tmpl.items[0]?.prompt}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs h-8 px-3 border-border font-medium flex-1 gap-1"
                        onClick={() => {
                          // Quick preview template with generic mock
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
                        Preview Sheet
                      </Button>

                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-3.5 bg-primary text-primary-foreground font-semibold flex-1 gap-1"
                        onClick={() => {
                          if (students.length === 0) {
                            showNotification("Please enroll a student or seed demo data first", "info");
                            return;
                          }
                          // Allocate to first student who has this gap or first student in matching grade
                          const matchStudent =
                            students.find((s) => tmpl.grades.includes(s.grade as Grade)) || students[0];
                          if (matchStudent) {
                            handleAllocateWorksheet(matchStudent, tmpl.gapTypeId, tmpl.tier, true);
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Allocate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {language === "hi" ? "संस्थागत कक्षाएं (School Classrooms)" : "Institutional Classrooms Overview"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tracking daily rotation pacing, reassessment intervals, and cohort gap counts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map((c) => {
                const classStudents = students.filter((s) => s.classId === c.id);
                const classGaps = learningGaps.filter(
                  (g) => g.status === "active" && classStudents.some((s) => s.id === g.studentId)
                );
                return (
                  <div key={c.id} className="p-5 rounded-3xl border border-border bg-card space-y-4 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="label-overline block">Classroom</span>
                        <h3 className="font-heading font-bold text-lg text-foreground mt-0.5">{c.name}</h3>
                      </div>
                      <span className="badge-pill bg-primary/10 text-primary border border-primary/20 text-[10px]">
                        {(c as any).teacherLabel || c.gradeBand || "Primary Section"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-2xl bg-muted/40">
                        <span className="text-[10px] text-muted-foreground block">Enrolled Students</span>
                        <span className="font-heading font-bold text-base text-foreground">{classStudents.length}</span>
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
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: VISUAL ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart: Subject Distribution */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {language === "hi" ? "FLN विषय वितरण" : "FLN Learning Gap Distribution"}
                  </h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {subjectDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Grade-wise Comparison */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {language === "hi" ? "कक्षा-वार साक्षरता व संख्यात्मकता" : "Class 1–3 Gap Breakdown"}
                  </h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="grade" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="Reading" fill={CHART_COLORS.rose} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Numeracy" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Resolved" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Common Gaps Bar Chart */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {language === "hi" ? "शीर्ष 6 सामान्य सीखने के अंतराल" : "Top Identified Competency Gaps"}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  Aggregated across all classes
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCompetencyData} layout="vertical" margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" stroke="#888888" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} width={180} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="Affected Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: SYNC LOGS */}
        {activeTab === "syncLogs" && (
          <div className="glass-panel p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {language === "hi" ? "सिंक ऑडिट ट्रांजैक्शन्स" : "Sync Audit & Replication Stream"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Real-time log of offline mutation batches received from teacher mobile devices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs gap-1.5"
                  onClick={exportAuditJSON}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Audit (JSON)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs gap-1.5"
                  onClick={fetchCentralData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-foreground">
                <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Operation</th>
                    <th className="py-3 px-3">Entity</th>
                    <th className="py-3 px-3">Entity ID</th>
                    <th className="py-3 px-3">Version</th>
                    <th className="py-3 px-3 text-right">Ingest Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {syncLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    syncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/40 font-mono text-[11px]">
                        <td className="py-2.5 px-3 text-muted-foreground">{formatShortDate(log.receivedAt)}</td>
                        <td className="py-2.5 px-3 font-bold text-primary">{log.operation}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{log.entityType}</td>
                        <td className="py-2.5 px-3 text-muted-foreground truncate max-w-xs">{log.entityId}</td>
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
