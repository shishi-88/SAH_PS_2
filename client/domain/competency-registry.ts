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
    label: "Consonant blending gap",
    description:
      "Drops or swaps the second consonant in blends such as bl, cl, st, fl, or pl.",
    labelHi: "व्यंजन संयोजन अंतराल",
    descriptionHi:
      "bl, cl, st, fl या pl जैसे संयोजनों में दूसरा व्यंजन छूट जाता है या बदल जाता है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to blending/cluster decoding, a common Class 1–3 literacy outcome. Not an official NIPUN code.",
    tags: [
      "blend:bl",
      "blend:cl",
      "blend:st",
      "blend:fl",
      "blend:gl",
      "blend:pl",
      "blend:cr",
      "blend:sm",
      "blend:dr",
      "blending",
    ],
  },
  {
    id: "letter-recognition-general",
    subject: "reading",
    grades: [1, 2],
    label: "Letter recognition gap",
    description:
      "Confuses or forgets the names of letters when they are shown one at a time.",
    labelHi: "अक्षर पहचान अंतराल",
    descriptionHi:
      "अक्षर एक-एक करके दिखाने पर उनके नाम उलझ जाते हैं या भूल जाते हैं।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to letter-name knowledge (NIPUN-style early literacy). Insert verified codes when available.",
    tags: ["letter-name"],
  },
  {
    id: "letter-sound-correspondence",
    subject: "reading",
    grades: [1, 2],
    label: "Letter-sound correspondence gap",
    description:
      "Knows some letter names but mixes up the sounds the letters make.",
    labelHi: "अक्षर-ध्वनि संगति अंतराल",
    descriptionHi:
      "कुछ अक्षरों के नाम पता हैं पर उनकी ध्वनि उलझ जाती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to grapheme–phoneme correspondence in early literacy.",
    tags: ["letter-sound"],
  },
  {
    id: "cvc-decoding",
    subject: "reading",
    grades: [1, 2],
    label: "CVC word decoding gap",
    description:
      "Reads letter by letter and blends the three sounds into short words with difficulty.",
    labelHi: "CVC शब्द पढ़ने का अंतराल",
    descriptionHi:
      "अक्षर-अक्षर पढ़ता है और तीन ध्वनियों को मिलाकर छोटा शब्द बनाने में कठिनाई होती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to decoding CVC words, a core Class 1–2 literacy outcome.",
    tags: ["cvc"],
  },
  {
    id: "word-reading-accuracy",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Word-reading accuracy gap",
    description:
      "Guesses or sounds out everyday words instead of reading them accurately.",
    labelHi: "शब्द पढ़ने की सटीकता अंतराल",
    descriptionHi:
      "सामान्य शब्दों को सटीक पढ़ने की बजाय अंदाज़ से या अक्षर-अक्षर करके पढ़ा जाता है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to word-level accuracy in connected reading.",
    tags: ["word"],
  },
  {
    id: "sentence-fluency",
    subject: "reading",
    grades: [1, 2, 3],
    label: "Sentence reading fluency gap",
    description:
      "Reads word by word with pauses, losing the flow of short sentences.",
    labelHi: "वाक्य पढ़ने की गति अंतराल",
    descriptionHi:
      "शब्द-शब्द करके रुक-रुक कर पढ़ता है, छोटे वाक्यों की लय खो जाती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to sentence-level fluency and phrasing.",
    tags: ["sentence"],
  },
  {
    id: "reading-fluency",
    subject: "reading",
    grades: [2, 3],
    label: "Oral reading fluency gap",
    description:
      "Reading is accurate but slow and effortful; long pauses break the flow.",
    labelHi: "मौखिक पढ़ने की गति अंतराल",
    descriptionHi:
      "पढ़ाई सटीक पर धीमी और मेहनत वाली होती है; लंबी रुकावटें लय तोड़ देती हैं।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to oral reading fluency (words correct per minute).",
    tags: ["fluency"],
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
  {
    id: "number-recognition",
    subject: "numeracy",
    grades: [1, 2],
    label: "Number recognition gap",
    description:
      "Confuses or forgets the names of numerals when they are shown one at a time.",
    labelHi: "संख्या पहचान अंतराल",
    descriptionHi:
      "संख्याएँ एक-एक करके दिखाने पर उनके नाम उलझ जाते हैं या भूल जाते हैं।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to numeral recognition in early number sense.",
    tags: ["number"],
  },
  {
    id: "counting-accuracy",
    subject: "numeracy",
    grades: [1, 2],
    label: "Counting accuracy gap",
    description:
      "Skips numbers, repeats numbers, or loses the order when counting aloud.",
    labelHi: "गिनती सटीकता अंतराल",
    descriptionHi:
      "ज़ोर से गिनते समय संख्याएँ छूटती, दोहराई जाती हैं या क्रम भटक जाता है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to stable-order counting (Class 1–2 numeracy).",
    tags: ["counting"],
  },
  {
    id: "number-sequencing",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Number sequencing gap",
    description:
      "Finds it hard to continue a number sequence forward or backward.",
    labelHi: "संख्या अनुक्रम अंतराल",
    descriptionHi:
      "संख्या अनुक्रम को आगे या पीछे जारी रखने में कठिनाई होती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to number sequence and counting-on skills.",
    tags: ["sequence"],
  },
  {
    id: "before-after",
    subject: "numeracy",
    grades: [1, 2],
    label: "Before/after number gap",
    description:
      "Cannot say which number comes immediately before or after a given number.",
    labelHi: "पहले/बाद संख्या अंतराल",
    descriptionHi:
      "किसी संख्या से ठीक पहले या बाद आने वाली संख्या नहीं बता पाता।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to number-neighbour knowledge (before/after).",
    tags: ["before-after"],
  },
  {
    id: "number-comparison",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Number comparison gap",
    description:
      "Mixed up about which of two numbers is bigger or smaller.",
    labelHi: "संख्या तुलना अंतराल",
    descriptionHi:
      "दो संख्याओं में से कौन बड़ी या छोटी है, इसमें उलझन होती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to comparing quantities and numerals.",
    tags: ["compare"],
  },
  {
    id: "tens-ones",
    subject: "numeracy",
    grades: [1, 2],
    label: "Tens and ones gap",
    description:
      "Cannot break a two-digit number into tens and ones.",
    labelHi: "दहाई-इकाई अंतराल",
    descriptionHi:
      "दो अंकों की संख्या को दहाई और इकाई में नहीं बाँट पाता।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to base-ten structure of two-digit numbers.",
    tags: ["tens-ones"],
  },
  {
    id: "addition-facts",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Addition facts gap",
    description:
      "Hesitates or makes errors on simple addition within 20 and beyond.",
    labelHi: "जोड़ (योग) अंतराल",
    descriptionHi:
      "सरल जोड़ (20 के भीतर और आगे) में रुकावट या गलतियाँ होती हैं।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to addition fact fluency (Class 1–3).",
    tags: ["addition"],
  },
  {
    id: "subtraction-facts",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Subtraction facts gap",
    description:
      "Hesitates or makes errors on simple subtraction facts.",
    labelHi: "घटाव अंतराल",
    descriptionHi:
      "सरल घटाव के सवालों में रुकावट या गलतियाँ होती हैं।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to subtraction fact fluency (Class 1–3).",
    tags: ["subtraction"],
  },
  {
    id: "number-bonds",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Number bonds gap",
    description:
      "Cannot recall the pairs that make a target number such as 10 or 20.",
    labelHi: "संख्या जोड़े (बॉन्ड्स) अंतराल",
    descriptionHi:
      "लक्ष्य संख्या (जैसे 10 या 20) बनाने वाले जोड़े याद नहीं रहते।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to part-part-whole number relationships.",
    tags: ["bonds"],
  },
  {
    id: "skip-counting",
    subject: "numeracy",
    grades: [1, 2, 3],
    label: "Skip counting gap",
    description:
      "Loses the rhythm when counting by 2s, 5s, or 10s.",
    labelHi: "छलाँग गिनती अंतराल",
    descriptionHi:
      "2, 5 या 10 की छलाँग में गिनते समय लय टूट जाती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to skip counting / multiples (Class 1–3).",
    tags: ["skip"],
  },
  {
    id: "word-problems",
    subject: "numeracy",
    grades: [2, 3],
    label: "Word problem solving gap",
    description:
      "Finds it hard to turn a simple story into the right addition or subtraction.",
    labelHi: "शाब्दिक समस्या अंतराल",
    descriptionHi:
      "सरल कहानी को सही जोड़ या घटाव में बदलने में कठिनाई होती है।",
    mappingSource: "demo",
    mappingNote:
      "Demo mapping to one-step word problem solving (Class 2–3).",
    tags: ["word-problem"],
  },
];

export function getGapType(id: string): CompetencyGapType | undefined {
  return COMPETENCY_GAP_TYPES.find((g) => g.id === id);
}

export function getAllGapTypes(): CompetencyGapType[] {
  return COMPETENCY_GAP_TYPES;
}

export function gapTypesFor(subject: Subject, grade: Grade): CompetencyGapType[] {
  return COMPETENCY_GAP_TYPES.filter(
    (g) => g.subject === subject && g.grades.includes(grade),
  );
}
