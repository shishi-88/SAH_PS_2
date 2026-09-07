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
    labelHi: "अक्षर-ध्वनि अंतराल: ब/द में उलझन",
    descriptionHi:
      "ब और द की ध्वनि या आकृति में उलझन होती है, अक्सर शब्द के शुरू में।",
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
    labelHi: "व्यंजन संयोजन अंतराल: bl/cl/st",
    descriptionHi:
      "bl, cl और st जैसे संयोजनों में दूसरा व्यंजन छूट जाता है या बदल जाता है।",
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
    labelHi: "शब्द-आरंभ सटीकता अंतराल",
    descriptionHi:
      "गलतियाँ शब्द के बाकी हिस्से की बजाय पहली ध्वनि या अक्षर पर केंद्रित होती हैं।",
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
    labelHi: "शब्द-अंत सटीकता अंतराल",
    descriptionHi:
      "शब्द सही शुरू होते हैं पर अंतिम ध्वनि छूटती, बदलती या अंदाज़ से बोली जाती है।",
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
    labelHi: "दृष्टि-शब्द स्मरण अंतराल",
    descriptionHi:
      "सामान्य शब्दों को पूरा पहचानने की बजाय अक्षर-अक्षर करके पढ़ा जाता है।",
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
    labelHi: "बहुअक्षरी शब्द पढ़ने का अंतराल",
    descriptionHi:
      "दो या अधिक अक्षरों वाले शब्दों पर रुकावट या गलती होती है।",
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
    labelHi: "दहाई-संक्रमण अंतराल: 9→10",
    descriptionHi: "9 से 10 पर जाते समय रुकावट या गलत गिनती होती है।",
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
    labelHi: "दहाई-संक्रमण अंतराल: 29→30",
    descriptionHi:
      "दहाई का अंक बदलने पर (जैसे 29 से 30) रुकावट या गलती होती है।",
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
    labelHi: "दहाई-संक्रमण अंतराल",
    descriptionHi:
      "एक दहाई के भीतर गिनती स्थिर रहती है, पर अगली दहाई शुरू होते ही फिसल जाती है।",
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
    labelHi: "स्थानीय मान अंतराल: दहाई बनाम सैकड़ा",
    descriptionHi:
      "दो या तीन अंकों की संख्या में अंक का मान उसकी जगह के हिसाब से उलझ जाता है।",
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
    labelHi: "उल्टी गिनती अंतराल",
    descriptionHi:
      "आगे की गिनती स्थिर है, पर उल्टी गिनती में क्रम फिसल जाता है।",
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
