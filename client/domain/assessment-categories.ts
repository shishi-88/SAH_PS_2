import type { Grade, Subject } from "./types";

/**
 * Skill-area categories shown when a teacher picks Reading or Numeracy.
 * Each category must have at least one real prompt in the prompt bank
 * (see prompts.ts) — these are never empty buttons.
 */
export interface AssessmentCategory {
  id: string;
  subject: Subject;
  grades: Grade[];
  label: string;
  description: string;
  icon:
    | "letters"
    | "sound"
    | "cvc"
    | "blend"
    | "word"
    | "sentence"
    | "passage"
    | "fluency"
    | "number"
    | "counting"
    | "sequence"
    | "beforeafter"
    | "compare"
    | "tens"
    | "place"
    | "add"
    | "sub"
    | "bond"
    | "skip"
    | "problem";
  /** Hindi equivalents. Falls back to English when absent. */
  labelHi?: string;
  descriptionHi?: string;
}

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  /* ── Reading ─────────────────────────────────────────────── */
  {
    id: "letter-recognition",
    subject: "reading",
    grades: [1, 2],
    label: "Letter Recognition",
    description: "Name letters when they are pointed to.",
    labelHi: "अक्षर पहचान",
    descriptionHi: "जब अक्षर दिखाया जाए तो उसका नाम बताना।",
    icon: "letters",
  },
  {
    id: "letter-sound",
    subject: "reading",
    grades: [1, 2],
    label: "Letter-Sound Recognition",
    description: "Say the sound each letter makes.",
    labelHi: "अक्षर-ध्वनि पहचान",
    descriptionHi: "हर अक्षर की ध्वनि बोलना।",
    icon: "sound",
  },
  {
    id: "cvc-words",
    subject: "reading",
    grades: [1, 2],
    label: "Simple / CVC Word Reading",
    description: "Read short consonant-vowel-consonant words.",
    labelHi: "सरल (CVC) शब्द पढ़ना",
    descriptionHi: "छोटे व्यंजन-स्वर-व्यंजन शब्द पढ़ना।",
    icon: "cvc",
  },
  {
    id: "consonant-blends",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Consonant Blends",
    description: "Read words with two starting sounds (bl, cl, st…).",
    labelHi: "संयुक्त व्यंजन",
    descriptionHi: "दो शुरुआती ध्वनियों वाले शब्द पढ़ना (क्ल, प्ल, स्ट…)।",
    icon: "blend",
  },
  {
    id: "word-reading",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Word Reading",
    description: "Read a list of everyday words aloud.",
    labelHi: "शब्द पढ़ना",
    descriptionHi: "रोज़मर्रा के शब्दों की सूची ज़ोर से पढ़ना।",
    icon: "word",
  },
  {
    id: "sentence-reading",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Sentence Reading",
    description: "Read short sentences smoothly.",
    labelHi: "वाक्य पढ़ना",
    descriptionHi: "छोटे वाक्य सहजता से पढ़ना।",
    icon: "sentence",
  },
  {
    id: "passage-reading",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Short Passage Reading",
    description: "Read a short connected passage aloud.",
    labelHi: "छोटा गद्यांश पढ़ना",
    descriptionHi: "एक छोटा जुड़ा हुआ गद्यांश ज़ोर से पढ़ना।",
    icon: "passage",
  },
  {
    id: "oral-fluency",
    subject: "reading",
    grades: [2, 3],
    label: "Oral Reading Fluency",
    description: "Read as much as possible in one minute.",
    labelHi: "मौखिक पढ़ने की गति (फ़्लुएंसी)",
    descriptionHi: "एक मिनट में जितना हो सके उतना पढ़ना।",
    icon: "fluency",
  },

  /* ── Numeracy ────────────────────────────────────────────── */
  {
    id: "number-recognition",
    subject: "numeracy",
    grades: [1, 2],
    label: "Number Recognition",
    description: "Name numbers when they are pointed to.",
    labelHi: "संख्या पहचान",
    descriptionHi: "जब संख्या दिखाई जाए तो उसका नाम बताना।",
    icon: "number",
  },
  {
    id: "counting",
    subject: "numeracy",
    grades: [1, 2],
    label: "Counting",
    description: "Count aloud in order, objects or rote.",
    labelHi: "गिनती",
    descriptionHi: "क्रम से ज़ोर से गिनना — चीज़ें या रटकर।",
    icon: "counting",
  },
  {
    id: "number-sequencing",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Number Sequencing",
    description: "Continue a number sequence, forward or back.",
    labelHi: "संख्या अनुक्रम",
    descriptionHi: "संख्या अनुक्रम को आगे या पीछे जारी रखना।",
    icon: "sequence",
  },
  {
    id: "before-after",
    subject: "numeracy",
    grades: [1, 2],
    label: "Before / After Numbers",
    description: "Say the number that comes before and after.",
    labelHi: "पहले / बाद की संख्या",
    descriptionHi: "किसी संख्या से पहले और बाद आने वाली संख्या बताना।",
    icon: "beforeafter",
  },
  {
    id: "number-comparison",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Number Comparison",
    description: "Decide which number is bigger or smaller.",
    labelHi: "संख्याओं की तुलना",
    descriptionHi: "कौन सी संख्या बड़ी या छोटी है, यह तय करना।",
    icon: "compare",
  },
  {
    id: "tens-ones",
    subject: "numeracy",
    grades: [1, 2],
    label: "Tens and Ones",
    description: "Split a two-digit number into tens and ones.",
    labelHi: "दहाई और इकाई",
    descriptionHi: "दो अंकों की संख्या को दहाई और इकाई में बाँटना।",
    icon: "tens",
  },
  {
    id: "place-value",
    subject: "numeracy",
    grades: [2, 3],
    label: "Place Value",
    description: "Read and compare numbers by digit place.",
    labelHi: "स्थानीय मान",
    descriptionHi: "अंकों की जगह के हिसाब से संख्याएँ पढ़ना और तुलना करना।",
    icon: "place",
  },
  {
    id: "addition",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Addition",
    description: "Solve addition facts and small sums.",
    labelHi: "जोड़",
    descriptionHi: "जोड़ के सवाल और छोटी राशियाँ हल करना।",
    icon: "add",
  },
  {
    id: "subtraction",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Subtraction",
    description: "Solve subtraction facts and take-away sums.",
    labelHi: "घटाव",
    descriptionHi: "घटाव के सवाल और निकालने वाली राशियाँ हल करना।",
    icon: "sub",
  },
  {
    id: "number-bonds",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Number Bonds",
    description: "Find pairs that make a target number (e.g. 10).",
    labelHi: "संख्या जोड़े (बॉन्ड्स)",
    descriptionHi: "ऐसे जोड़े खोजना जो मिलकर लक्ष्य संख्या (जैसे 10) बनाएँ।",
    icon: "bond",
  },
  {
    id: "skip-counting",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Skip Counting",
    description: "Count by 2s, 5s, and 10s.",
    labelHi: "छलाँग गिनती",
    descriptionHi: "2, 5 और 10 की छलाँग में गिनना।",
    icon: "skip",
  },
  {
    id: "word-problems",
    subject: "numeracy",
    grades: [2, 3],
    label: "Simple Word Problems",
    description: "Solve one-step story problems.",
    labelHi: "सरल शाब्दिक समस्याएँ",
    descriptionHi: "एक-चरणीय कहानी वाले सवाल हल करना।",
    icon: "problem",
  },
];

export function getCategory(id: string): AssessmentCategory | undefined {
  return ASSESSMENT_CATEGORIES.find((c) => c.id === id);
}

/** Categories that have prompts for this subject and grade. */
export function categoriesFor(subject: Subject, grade: Grade): AssessmentCategory[] {
  return ASSESSMENT_CATEGORIES.filter(
    (c) => c.subject === subject && c.grades.includes(grade),
  );
}