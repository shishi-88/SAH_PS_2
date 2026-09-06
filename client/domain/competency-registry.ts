import type { CompetencyGapType, Grade, Subject } from "./types";

/**
 * Competency / skill-gap registry for Class 1–3 foundational literacy and numeracy.
 *
 * Mapping source:
 * - "demo" — illustrative labels for SIH demonstration, structured so official
 *   NIPUN Bharat codes can be inserted later. Not claimed as verified gazette mappings.
 * - "verified" — reserved for mappings checked against official NIPUN Bharat
 *   documents. None are present in this repository yet.
 */
export const COMPETENCY_GAP_TYPES: CompetencyGapType[] = [
  {
    id: "letter-sound-bd",
    subject: "reading",
    grades: [1, 2],
    label: "Letter-sound gap: b/d confusion",
    description:
      "Mixes the sounds or shapes of b and d, often at the beginning of words.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to foundational letter–sound correspondence (Class 1–2 literacy). Insert verified NIPUN codes here when available.",
    tags: ["letter:b", "letter:d", "letter-sound"],
  },
  {
    id: "consonant-blend-bl-cl-st",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Consonant blending gap: bl/cl/st",
    description:
      "Drops or swaps the second consonant in blends such as bl, cl, and st.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to blending/cluster decoding, a common Class 1–3 literacy outcome. Not an official NIPUN code.",
    tags: ["blend:bl", "blend:cl", "blend:st", "blending"],
  },
  {
    id: "word-position-begin",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Beginning-of-word accuracy gap",
    description:
      "Errors cluster on the first sound or letter of words rather than the rest of the word.",
    mappingSource: "demo",
    mappingNote:
      "Demo pattern tag for beginning/middle/end error location. Useful for grouping practice; not an official competency code.",
    tags: ["position:begin"],
  },
  {
    id: "word-position-end",
    subject: "reading",
    grades: [1, 2, 3],
    label: "End-of-word accuracy gap",
    description:
      "Words start correctly but the last sound is dropped, swapped, or guessed.",
    mappingSource: "demo",
    mappingNote:
      "Demo pattern tag for ending-sound attention. Replace with verified mapping if an official code is added.",
    tags: ["position:end"],
  },
  {
    id: "sight-word-recall",
    subject: "reading",
    grades: [1, 2],
    label: "Sight-word recall gap",
    description:
      "High-frequency words are sounded letter-by-letter instead of recognised as wholes.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to high-frequency word recognition in early literacy. Not a verified NIPUN identifier.",
    tags: ["sight"],
  },
  {
    id: "multisyllable-decoding",
    subject: "reading",
    grades: [2, 3],
    label: "Multisyllable decoding gap",
    description:
      "Hesitates or loses accuracy on words with two or more syllables.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to longer-word decoding in Class 2–3. Official codes can be added without changing diagnosis tags.",
    tags: ["multisyllable"],
  },
  {
    id: "decade-9-10",
    subject: "numeracy",
    grades: [1, 2],
    label: "Decade-transition gap: 9→10",
    description: "Hesitates or miscounts when crossing from 9 to 10.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to counting across tens (NIPUN-style number sense). Not an official competency ID.",
    tags: ["decade:10"],
  },
  {
    id: "decade-29-30",
    subject: "numeracy",
    grades: [2, 3],
    label: "Decade-transition gap: 29→30",
    description:
      "Pause or error when the tens digit changes, for example 29 to 30.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to decade jumps within 100. Structure is ready for verified NIPUN codes.",
    tags: ["decade:30"],
  },
  {
    id: "decade-generic",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Decade-transition gap",
    description:
      "Counting is steady within a ten, then slips when the next ten begins.",
    mappingSource: "demo",
    mappingNote:
      "Catch-all demo tag for other decade boundaries (19→20, 39→40, …).",
    tags: ["decade"],
  },
  {
    id: "place-value-tens-hundreds",
    subject: "numeracy",
    grades: [2, 3],
    label: "Place value gap: tens vs hundreds",
    description:
      "A digit’s value is mixed up depending on its place in a 2- or 3-digit number.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to place-value understanding. Insert verified codes when available.",
    tags: ["place-value"],
  },
  {
    id: "backward-counting",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Backward counting gap",
    description:
      "Forward counting is steady, but the sequence slips when counting backward.",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to reverse counting / number sequence. Not a verified official code.",
    tags: ["backward"],
  },
];

export function getGapType(id: string): CompetencyGapType | undefined {
  return COMPETENCY_GAP_TYPES.find((g) => g.id === id);
}

export function gapTypesFor(subject: Subject, grade: Grade): CompetencyGapType[] {
  return COMPETENCY_GAP_TYPES.filter(
    (g) => g.subject === subject && g.grades.includes(grade),
  );
}
