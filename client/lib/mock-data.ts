export type SkillArea = "reading" | "numeracy";

export type GapStatus = "priority" | "attention" | "ontrack" | "resolved";

export interface GapTemplate {
  id: string;
  skillArea: SkillArea;
  grade: 1 | 2 | 3;
  label: string;
  description: string;
  worksheetTitle: string;
  worksheetFocus: string;
}

export interface StudentGap {
  templateId: string;
  detectedAt: string; // ISO date
  status: GapStatus;
  worksheetAssigned: boolean;
  reassessDueAt: string; // ISO date
}

export interface Student {
  id: string;
  name: string;
  grade: 1 | 2 | 3;
  rollNo: string;
  avatarTint: "teal" | "coral" | "sand" | "sage";
  lastAssessed: string | null; // ISO date
  assessedThisWeek: boolean;
  gaps: StudentGap[];
}

export const gapTemplates: GapTemplate[] = [
  {
    id: "read-g1-letter-bd",
    skillArea: "reading",
    grade: 1,
    label: "Letter-sound gap: b/d confusion",
    description:
      "Mixes up the sounds and shapes of b and d, especially at the start of words.",
    worksheetTitle: "b vs d Sound Sort",
    worksheetFocus: "Letter-sound discrimination, tracing and sorting b/d words",
  },
  {
    id: "read-g2-blend-blclst",
    skillArea: "reading",
    grade: 2,
    label: "Consonant blending gap: bl/cl/st",
    description:
      "Drops or swaps the second consonant in blends like bl, cl and st while reading aloud.",
    worksheetTitle: "Blend Builders: bl · cl · st",
    worksheetFocus: "Guided blending practice with picture-supported words",
  },
  {
    id: "read-g3-multisyll",
    skillArea: "reading",
    grade: 3,
    label: "Multisyllable decoding gap",
    description:
      "Hesitates and loses accuracy on words with three or more syllables.",
    worksheetTitle: "Syllable Break-Up Cards",
    worksheetFocus: "Chunking longer words into syllables before reading",
  },
  {
    id: "read-g1-sight",
    skillArea: "reading",
    grade: 1,
    label: "Sight-word recall gap",
    description:
      "Cannot recognise common high-frequency words without sounding out each letter.",
    worksheetTitle: "Everyday Words Flash Sheet",
    worksheetFocus: "Repetition drills for grade-1 high-frequency word list",
  },
  {
    id: "num-g1-decade-10",
    skillArea: "numeracy",
    grade: 1,
    label: "Decade-transition gap: 9→10",
    description: "Hesitates or miscounts when crossing from 9 to 10.",
    worksheetTitle: "Crossing to 10 Number Path",
    worksheetFocus: "Counting practice across the 9-to-10 boundary with objects",
  },
  {
    id: "num-g2-decade-30",
    skillArea: "numeracy",
    grade: 2,
    label: "Decade-transition gap: 29→30",
    description:
      "Consistent pause or error when the tens digit changes, e.g. 29 to 30.",
    worksheetTitle: "Decade Jump Practice",
    worksheetFocus: "Sequencing drills across every decade boundary to 100",
  },
  {
    id: "num-g3-placevalue",
    skillArea: "numeracy",
    grade: 3,
    label: "Place value gap: tens vs hundreds",
    description:
      "Confuses the value of a digit depending on its position in a 3-digit number.",
    worksheetTitle: "Hundreds, Tens, Ones Grid",
    worksheetFocus: "Building and naming 3-digit numbers with place-value blocks",
  },
  {
    id: "num-g2-subtraction",
    skillArea: "numeracy",
    grade: 2,
    label: "Backward counting gap",
    description:
      "Can count forward reliably but loses track when counting backward from a given number.",
    worksheetTitle: "Backward Count Ladder",
    worksheetFocus: "Scaffolded backward counting from varied starting points",
  },
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export const students: Student[] = [
  {
    id: "s1",
    name: "Ananya Verma",
    grade: 1,
    rollNo: "01",
    avatarTint: "teal",
    lastAssessed: daysAgo(2),
    assessedThisWeek: true,
    gaps: [
      {
        templateId: "read-g1-letter-bd",
        detectedAt: daysAgo(20),
        status: "priority",
        worksheetAssigned: true,
        reassessDueAt: daysAgo(-1),
      },
    ],
  },
  {
    id: "s2",
    name: "Rahul Kumar",
    grade: 1,
    rollNo: "02",
    avatarTint: "coral",
    lastAssessed: daysAgo(9),
    assessedThisWeek: false,
    gaps: [
      {
        templateId: "num-g1-decade-10",
        detectedAt: daysAgo(9),
        status: "attention",
        worksheetAssigned: true,
        reassessDueAt: daysFromNow(3),
      },
    ],
  },
  {
    id: "s3",
    name: "Fatima Sheikh",
    grade: 2,
    rollNo: "03",
    avatarTint: "sage",
    lastAssessed: daysAgo(1),
    assessedThisWeek: true,
    gaps: [
      {
        templateId: "read-g2-blend-blclst",
        detectedAt: daysAgo(25),
        status: "priority",
        worksheetAssigned: true,
        reassessDueAt: daysAgo(-2),
      },
      {
        templateId: "num-g2-decade-30",
        detectedAt: daysAgo(6),
        status: "attention",
        worksheetAssigned: true,
        reassessDueAt: daysFromNow(4),
      },
    ],
  },
  {
    id: "s4",
    name: "Vivaan Singh",
    grade: 2,
    rollNo: "04",
    avatarTint: "sand",
    lastAssessed: daysAgo(15),
    assessedThisWeek: false,
    gaps: [
      {
        templateId: "num-g2-decade-30",
        detectedAt: daysAgo(15),
        status: "priority",
        worksheetAssigned: true,
        reassessDueAt: daysAgo(-3),
      },
    ],
  },
  {
    id: "s5",
    name: "Meera Joshi",
    grade: 3,
    rollNo: "05",
    avatarTint: "teal",
    lastAssessed: daysAgo(3),
    assessedThisWeek: true,
    gaps: [
      {
        templateId: "read-g3-multisyll",
        detectedAt: daysAgo(3),
        status: "attention",
        worksheetAssigned: true,
        reassessDueAt: daysFromNow(10),
      },
    ],
  },
  {
    id: "s6",
    name: "Aarav Patil",
    grade: 3,
    rollNo: "06",
    avatarTint: "coral",
    lastAssessed: daysAgo(30),
    assessedThisWeek: false,
    gaps: [
      {
        templateId: "num-g3-placevalue",
        detectedAt: daysAgo(30),
        status: "attention",
        worksheetAssigned: true,
        reassessDueAt: daysAgo(2),
      },
    ],
  },
  {
    id: "s7",
    name: "Sara Khan",
    grade: 1,
    rollNo: "07",
    avatarTint: "sage",
    lastAssessed: null,
    assessedThisWeek: false,
    gaps: [],
  },
  {
    id: "s8",
    name: "Kabir Reddy",
    grade: 2,
    rollNo: "08",
    avatarTint: "sand",
    lastAssessed: daysAgo(4),
    assessedThisWeek: true,
    gaps: [
      {
        templateId: "num-g2-subtraction",
        detectedAt: daysAgo(4),
        status: "attention",
        worksheetAssigned: true,
        reassessDueAt: daysFromNow(9),
      },
    ],
  },
  {
    id: "s9",
    name: "Diya Nair",
    grade: 1,
    rollNo: "09",
    avatarTint: "teal",
    lastAssessed: daysAgo(1),
    assessedThisWeek: true,
    gaps: [
      {
        templateId: "read-g1-sight",
        detectedAt: daysAgo(35),
        status: "priority",
        worksheetAssigned: true,
        reassessDueAt: daysAgo(-5),
      },
    ],
  },
  {
    id: "s10",
    name: "Ishaan Mehta",
    grade: 3,
    rollNo: "10",
    avatarTint: "coral",
    lastAssessed: null,
    assessedThisWeek: false,
    gaps: [],
  },
];

export function getGapTemplate(id: string) {
  return gapTemplates.find((g) => g.id === id);
}

export function getStudent(id: string) {
  return students.find((s) => s.id === id);
}

export interface GapGroup {
  templateId: string;
  template: GapTemplate;
  studentIds: string[];
  weeksActive: number;
  severity: GapStatus;
}

export function getGapGroups(list: Student[] = students): GapGroup[] {
  const map = new Map<string, { studentIds: string[]; oldest: number }>();

  for (const student of list) {
    for (const gap of student.gaps) {
      if (gap.status === "resolved") continue;
      const entry = map.get(gap.templateId) ?? { studentIds: [], oldest: Date.now() };
      entry.studentIds.push(student.id);
      entry.oldest = Math.min(entry.oldest, new Date(gap.detectedAt).getTime());
      map.set(gap.templateId, entry);
    }
  }

  const groups: GapGroup[] = [];
  for (const [templateId, entry] of map) {
    const template = getGapTemplate(templateId);
    if (!template) continue;
    const weeksActive = Math.max(
      0,
      Math.round((Date.now() - entry.oldest) / (7 * 24 * 60 * 60 * 1000)),
    );
    const severity: GapStatus =
      weeksActive >= 3 || entry.studentIds.length >= 3
        ? "priority"
        : weeksActive >= 1
          ? "attention"
          : "ontrack";
    groups.push({ templateId, template, studentIds: entry.studentIds, weeksActive, severity });
  }

  return groups.sort((a, b) => {
    const rank = { priority: 0, attention: 1, ontrack: 2, resolved: 3 };
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    return b.studentIds.length - a.studentIds.length;
  });
}

export const readingPrompts: Record<1 | 2 | 3, { title: string; text: string }> = {
  1: {
    title: "The Little Blue Boat",
    text: "The dog can run. The cat can nap. Dad and I sit by the mat.",
  },
  2: {
    title: "Clever Crow",
    text: "A clever crow found a jug with a little water. It dropped small stones in, and the water rose to the top.",
  },
  3: {
    title: "The Community Garden",
    text: "Every Saturday, the neighbourhood children gather at the community garden to water vegetables and celebrate the harvest together.",
  },
};

export const numeracyPrompts: Record<1 | 2 | 3, { title: string; text: string }> = {
  1: { title: "Count 1 to 20", text: "1, 2, 3, 4, 5 … 8, 9, 10 … 18, 19, 20" },
  2: { title: "Count by Tens", text: "10, 20, 29, 30, 40 … 58, 59, 60, 70" },
  3: { title: "Three-Digit Numbers", text: "108, 199, 200, 245, 350, 499, 500" },
};
