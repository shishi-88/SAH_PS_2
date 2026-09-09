import type {
  AssessmentPrompt,
  CompetencyGapType,
  WorksheetInstance,
  WorksheetTemplate,
} from "@/domain/types";

export type Language = "en" | "hi";

export const LANGUAGES: Language[] = ["en", "hi"];

type StringKey = keyof typeof STRINGS;

const STRINGS = {
  /* App layout / header */
  "nav.home": { en: "Home", hi: "मुख्य" },
  "nav.class": { en: "Class", hi: "कक्षा" },
  "nav.assess": { en: "Assess", hi: "आकलन" },
  "nav.sheets": { en: "Sheets", hi: "पत्र" },
  "nav.sync": { en: "Sync", hi: "सिंक" },
  "header.offline": {
    en: "Works offline · saved on this phone",
    hi: "ऑफ़लाइन चलता है · इस फ़ोन पर सुरक्षित",
  },
  "header.language": { en: "Language", hi: "भाषा" },

  /* Home */
  "home.opening": { en: "Opening class records…", hi: "कक्षा का रिकॉर्ड खुल रहा है…" },
  "home.assessCta": { en: "Assess a student", hi: "विद्यार्थी का आकलन करें" },
  "home.assessSub": {
    en: "Reading or numeracy · mark what you heard",
    hi: "पढ़ना या गणित · जो सुना उसे चिह्नित करें",
  },
  "home.rotation": { en: "This rotation", hi: "यह चक्र" },
  "home.heard": {
    en: "{done} of {total} students heard",
    hi: "{total} में से {done} विद्यार्थियों का आकलन हुआ",
  },
  "home.aboutRotation": {
    en: "About {perDay} students a day → roughly {days} more school day{s} to finish the class.",
    hi: "प्रतिदिन लगभग {perDay} विद्यार्थी → पूरी कक्षा के लिए लगभग {days} स्कूल दिन और।",
  },
  "home.rotationDone": {
    en: "Everyone in this rotation has been assessed. The next round starts automatically.",
    hi: "इस चक्र में सभी का आकलन हो चुका है। अगला दौर अपने आप शुरू होगा।",
  },
  "home.due": { en: "Ready for a second listen", hi: "दोबारा सुनने के लिए तैयार" },
  "home.smallGroups": { en: "Small groups this week", hi: "इस सप्ताह के छोटे समूह" },
  "home.classWall": { en: "Class wall", hi: "कक्षा दीवार" },
  "home.noGroups": {
    en: "No open gaps yet — assess a few students to see suggested groups.",
    hi: "अभी कोई खुला अंतराल नहीं — सुझाए गए समूह देखने के लिए कुछ विद्यार्थियों का आकलन करें।",
  },
  "home.yourStudents": { en: "Your students", hi: "आपके विद्यार्थी" },
  "home.add": { en: "Add", hi: "जोड़ें" },
  "home.addFirst": { en: "Add the first student to begin.", hi: "शुरू करने के लिए पहला विद्यार्थी जोड़ें।" },
  "home.gradeRoll": { en: "Grade {grade} · Roll {roll}", hi: "कक्षा {grade} · रोल {roll}" },
  "home.notAssessed": { en: "Not yet assessed", hi: "अभी आकलन नहीं हुआ" },
  "home.assess": { en: "Assess", hi: "आकलन" },
  "home.today": { en: "Today", hi: "आज" },
  "home.todayClear": {
    en: "All caught up — nothing due today.",
    hi: "सब तैयार — आज कुछ बाकी नहीं।",
  },
  "home.actionsAssess": {
    en: "Assess {n} student{s}",
    hi: "{n} विद्यार्थियों का आकलन करें",
  },
  "home.actionsReassess": {
    en: "Reassess {n} student{s}",
    hi: "{n} विद्यार्थियों का दोबारा आकलन करें",
  },
  "home.actionsPractice": {
    en: "Give practice to {n} student{s}",
    hi: "{n} विद्यार्थियों को अभ्यास दें",
  },
  "home.actionsGroup": {
    en: "Run a small-group activity",
    hi: "छोटे समूह की गतिविधि चलाएँ",
  },
  "home.nextUp": { en: "Next up in rotation", hi: "चक्र में अगले" },
  "home.groupStudents": { en: "{n} students · {label}", hi: "{n} विद्यार्थी · {label}" },

  /* Assess flow */
  "assess.chooseStudent": { en: "Choose a student", hi: "विद्यार्थी चुनें" },
  "assess.skill": { en: "Reading or numeracy?", hi: "पढ़ना या गणित?" },
  "assess.choosePrompt": { en: "Choose a prompt", hi: "पाठ चुनें" },
  "assess.listen": { en: "Listen", hi: "सुनें" },
  "assess.whatHeard": { en: "What did you hear?", hi: "आपने क्या सुना?" },
  "assess.gapTitle": { en: "Skill gap", hi: "सीखने का अंतराल" },
  "assess.loading": { en: "Loading…", hi: "लोड हो रहा है…" },
  "assess.addFirst": { en: "Add a student first.", hi: "पहले विद्यार्थी जोड़ें।" },
  "assess.createProfile": { en: "Create profile", hi: "प्रोफ़ाइल बनाएँ" },
  "assess.reading": { en: "Reading", hi: "पढ़ना" },
  "assess.readingDetail": {
    en: "Letters, sounds, words, sentences, and passages",
    hi: "अक्षर, ध्वनियाँ, शब्द, वाक्य और गद्यांश",
  },
  "assess.numeracy": { en: "Numeracy", hi: "गणित" },
  "assess.numeracyDetail": {
    en: "Numbers, counting, place value, and operations",
    hi: "संख्याएँ, गिनती, स्थानीय मान और संक्रियाएँ",
  },
  "assess.readingPassage": { en: "Reading passage", hi: "पढ़ने का गद्यांश" },
  "assess.numberSequence": { en: "Number sequence", hi: "संख्या श्रृंखला" },
  "assess.gradeLabel": { en: "Grade {grade}", hi: "कक्षा {grade}" },
  "assess.speechWithRec": {
    en: "This browser may offer dictation. It usually needs a network connection and is not guaranteed offline. Diagnosis still works if you mark what you heard.",
    hi: "यह ब्राउज़र श्रुतलेख दे सकता है। इसमें आमतौर पर इंटरनेट चाहिए और ऑफ़लाइन की गारंटी नहीं है। आप जो सुना उसे चिह्नित करें तो निदान फिर भी काम करेगा।",
  },
  "assess.speechNoRec": {
    en: "On-device speech-to-text is not available here. Record if you wish, then mark errors by hand — that path works fully offline.",
    hi: "यहाँ ऑन-डिवाइस वाक्-से-पाठ उपलब्ध नहीं है। चाहें तो रिकॉर्ड करें, फिर गलतियाँ हाथ से चिह्नित करें — यह रास्ता पूरी तरह ऑफ़लाइन काम करता है।",
  },
  "assess.listening": { en: "Listening… {time}", hi: "सुन रहे हैं… {time}" },
  "assess.startListening": { en: "Start listening", hi: "सुनना शुरू करें" },
  "assess.skipRecord": {
    en: "Skip recording — mark by hand",
    hi: "रिकॉर्डिंग छोड़ें — हाथ से चिह्नित करें",
  },
  "assess.dictation": {
    en: "Optional dictation (may need internet): ",
    hi: "वैकल्पिक श्रुतलेख (इंटरनेट चाहिए हो सकता है): ",
  },
  "assess.extraNotes": { en: "Extra notes", hi: "अतिरिक्त टिप्पणी" },
  "assess.notesPlaceholder": {
    en: "Anything else you noticed…",
    hi: "और कुछ जो आपने देखा…",
  },
  "assess.findGap": { en: "Find the skill gap", hi: "सीखने का अंतराल खोजें" },
  "assess.namedGap": { en: "Named gap", hi: "पहचाना गया अंतराल" },
  "assess.noGapOption": {
    en: "No specific gap this time — save a clear sample only.",
    hi: "इस बार कोई विशेष अंतराल नहीं — केवल स्पष्ट नमूना सहेजें।",
  },
  "assess.saveGap": {
    en: "Save gap and make practice sheet",
    hi: "अंतराल सहेजें और अभ्यास पत्र बनाएँ",
  },
  "assess.saveSample": { en: "Save sample", hi: "नमूना सहेजें" },
  "assess.saving": { en: "Saving on this phone…", hi: "इस फ़ोन पर सहेजा जा रहा है…" },
  "assess.savedTo": {
    en: "Saved to {first}'s record",
    hi: "{first} के रिकॉर्ड में सहेजा गया",
  },
  "assess.previewPrint": { en: "Preview / print", hi: "पूर्वावलोकन / प्रिंट" },
  "assess.studentHistory": { en: "Student history", hi: "विद्यार्थी इतिहास" },
  "assess.backToClass": { en: "Back to class", hi: "कक्षा में वापस" },
  "assess.sourceTeacher": {
    en: "Source: teacher marks + rules. Mappings marked demo until verified NIPUN codes are inserted.",
    hi: "स्रोत: शिक्षक के निशान + नियम। सत्यापित NIPUN कोड जुड़ने तक मैपिंग डेमो के रूप में चिह्नित है।",
  },
  "assess.sourceDictation": {
    en: "Source: optional dictation + rules. Mappings marked demo until verified NIPUN codes are inserted.",
    hi: "स्रोत: वैकल्पिक श्रुतलेख + नियम। सत्यापित NIPUN कोड जुड़ने तक मैपिंग डेमो के रूप में चिह्नित है।",
  },

  /* Token marker */
  "marker.hint": {
    en: "Tap a word each time you hear a slip. Cycle: clear → wrong → skipped → pause.",
    hi: "जब भी गलती सुनें, शब्द पर टैप करें। क्रम: साफ़ → गलत → छोड़ा → रुकावट।",
  },

  /* Worksheets */
  "ws.title": { en: "Practice sheets", hi: "अभ्यास पत्र" },
  "ws.classIntro": {
    en: "{n} practice sheets, tied to diagnosed gaps and grouped by class.",
    hi: "{n} अभ्यास पत्र, पहचाने गए अंतरालों से जुड़े और कक्षा के हिसाब से।",
  },
  "ws.sheets": { en: "{n} sheets", hi: "{n} पत्र" },
  "ws.empty": {
    en: "No sheets yet. Finish an assessment to generate one.",
    hi: "अभी कोई पत्र नहीं। आकलन पूरा करने पर एक बनेगा।",
  },
  "ws.tier": { en: "tier {tier}", hi: "स्तर {tier}" },
  "ws.practiced": { en: "Practiced", hi: "अभ्यास पूरा" },

  /* Worksheet detail */
  "wsd.print": { en: "Print / save as PDF", hi: "प्रिंट / PDF सहेजें" },
  "wsd.studentRecord": { en: "Student record", hi: "विद्यार्थी रिकॉर्ड" },
  "wsd.notFound": { en: "Sheet not found.", hi: "पत्र नहीं मिला।" },
  "wsd.markPracticed": {
    en: "Mark practiced",
    hi: "अभ्यास पूरा चिह्नित करें",
  },
  "wsd.practicedDone": { en: "Practiced ✓", hi: "अभ्यास पूरा ✓" },
  "wsd.practiceHint": {
    en: "Marking this practiced moves the gap toward reassessment.",
    hi: "इसे अभ्यास-पूर्ण चिह्नित करने पर अंतराल दोबारा आकलन की ओर बढ़ता है।",
  },

  /* Worksheet preview */
  "wp.practiceSheet": { en: "Practice sheet · Tier {tier}", hi: "अभ्यास पत्र · स्तर {tier}" },
  "wp.student": { en: "Student", hi: "विद्यार्थी" },
  "wp.gradeRollLabel": { en: "Grade / Roll", hi: "कक्षा / रोल" },
  "wp.gradeRoll": { en: "Grade {grade} · {roll}", hi: "कक्षा {grade} · {roll}" },
  "wp.date": { en: "Date", hi: "दिनांक" },
  "wp.focusGap": { en: "Focus gap", hi: "लक्ष्य अंतराल" },
  "wp.linkedGap": { en: "Linked skill gap", hi: "जुड़ा सीखने का अंतराल" },
  "wp.footer": {
    en: "From the tagged worksheet bank — not generated by a language model. Adjust only the matching drill if the gap remains after reassessment.",
    hi: "टैग किए गए अभ्यास-पत्र बैंक से — किसी भाषा-मॉडल से नहीं बना। दोबारा आकलन के बाद भी अंतराल बना रहे तो केवल संबंधित अभ्यास बदलें।",
  },

  /* Sync & settings */
  "sync.title": { en: "Sync & settings", hi: "सिंक और सेटिंग्स" },
  "sync.intro": {
    en: "Core work never needs the internet. When you have a connection, only anonymised gap-type counts are sent — no names, rolls, or student IDs.",
    hi: "मुख्य काम के लिए इंटरनेट कभी नहीं चाहिए। कनेक्शन होने पर केवल अनामित अंतराल-प्रकार की संख्याएँ भेजी जाती हैं — कोई नाम, रोल या विद्यार्थी ID नहीं।",
  },
  "sync.onPhone": { en: "On this phone", hi: "इस फ़ोन पर" },
  "sync.counts": {
    en: "{students} students · {gaps} open gaps",
    hi: "{students} विद्यार्थी · {gaps} खुले अंतराल",
  },
  "sync.reportPreview": { en: "Reporting preview", hi: "रिपोर्ट पूर्वावलोकन" },
  "sync.band": {
    en: "Class size band {band} · {types} gap types",
    hi: "कक्षा आकार श्रेणी {band} · {types} अंतराल प्रकार",
  },
  "sync.syncTotals": { en: "Sync anonymised totals", hi: "अनामित कुल सिंक करें" },
  "sync.trying": {
    en: "Trying the reporting endpoint…",
    hi: "रिपोर्टिंग एंडपॉइंट से जुड़ने का प्रयास…",
  },
  "sync.waiting": {
    en: "{n} item(s) waiting in the local queue.",
    hi: "स्थानीय कतार में {n} आइटम प्रतीक्षा में।",
  },
  "sync.flushOk": {
    en: "Synced anonymised gap counts.",
    hi: "अनामित अंतराल संख्याएँ सिंक हो गईं।",
  },
  "sync.flushFail": {
    en: "Could not reach the reporting endpoint. The queue stays on this phone until you try again.",
    hi: "रिपोर्टिंग एंडपॉइंट तक नहीं पहुँच पाए। कतार इस फ़ोन पर तब तक रहेगी जब तक आप दोबारा प्रयास नहीं करते।",
  },
  "sync.storageEncrypted": {
    en: "Saved on this phone. Records are wrapped with a device key (AES-GCM). This is not a password vault — anyone who can unlock the phone and open this app can read them.",
    hi: "इस फ़ोन पर सहेजा गया। रिकॉर्ड डिवाइस कुंजी (AES-GCM) से सुरक्षित हैं। यह पासवर्ड वॉल्ट नहीं है — फ़ोन अनलॉक करके ऐप खोलने वाला कोई भी इन्हें पढ़ सकता है।",
  },
  "sync.storagePlain": {
    en: "Saved on this phone using ordinary browser storage. Web Crypto was not available, so the file is not encrypted. Rely on the device lock.",
    hi: "इस फ़ोन पर सामान्य ब्राउज़र स्टोरेज में सहेजा गया। Web Crypto उपलब्ध नहीं था, इसलिए फ़ाइल एन्क्रिप्टेड नहीं है। डिवाइस लॉक पर भरोसा करें।",
  },
  "sync.class": { en: "Class", hi: "कक्षा" },
  "sync.className": { en: "Class name", hi: "कक्षा का नाम" },
  "sync.sentAt": { en: "sent {date}", hi: "{date} को भेजा" },
  "sync.reassessAfter": { en: "Reassess after", hi: "दोबारा आकलन कब" },
  "sync.oneWeek": { en: "1 week (7 days)", hi: "1 सप्ताह (7 दिन)" },
  "sync.twoWeeks": { en: "2 weeks (14 days)", hi: "2 सप्ताह (14 दिन)" },
  "sync.rotationAssumes": {
    en: "Rotation assumes about {n} students a day.",
    hi: "चक्र में प्रतिदिन लगभग {n} विद्यार्थी माने गए हैं।",
  },
  "sync.openClassWall": { en: "Open class wall", hi: "कक्षा दीवार खोलें" },
  "sync.reloadDemo": {
    en: "Reload demo class on this phone",
    hi: "इस फ़ोन पर डेमो कक्षा फिर से लोड करें",
  },
  "sync.reportTitle": { en: "Anonymised reporting", hi: "अनामित रिपोर्टिंग" },
  "sync.lastSynced": { en: "Last synced {date}", hi: "{date} को सिंक हुआ" },
  "sync.neverSynced": { en: "Never synced", hi: "अभी सिंक नहीं हुआ" },
  "sync.queueTitle": { en: "Recent syncs", hi: "हाल के सिंक" },
  "sync.queueEmpty": {
    en: "Nothing sent yet — the queue stays on this phone until you sync.",
    hi: "अभी कुछ नहीं भेजा गया — सिंक करने तक कतार इसी फ़ोन पर रहती है।",
  },
  "sync.statusPending": { en: "Pending", hi: "प्रतीक्षा में" },
  "sync.statusSynced": { en: "Synced", hi: "सिंक हुआ" },
  "sync.statusFailed": { en: "Failed", hi: "विफल" },
  "sync.studentsPerDay": { en: "Students per day", hi: "प्रतिदिन विद्यार्थी" },
  "sync.demoTitle": { en: "Demo data", hi: "डेमो डेटा" },
  "sync.demoNote": {
    en: "This replaces everything on this phone with the demo class.",
    hi: "यह इस फ़ोन का सारा डेटा डेमो कक्षा से बदल देगा।",
  },

  /* Class wall */
  "wall.title": { en: "Class wall", hi: "कक्षा दीवार" },
  "wall.intro": {
    en: "Shared skill gaps — not scores, not ranks. Persistent gaps (3+ weeks) sit higher than newly noticed ones.",
    hi: "साझा सीखने के अंतराल — न अंक, न रैंक। लंबे समय से चले अंतराल (3+ सप्ताह) नए पहचाने गए अंतरालों से ऊपर रहते हैं।",
  },
  "wall.empty": { en: "No open gaps on the wall yet.", hi: "दीवार पर अभी कोई खुला अंतराल नहीं।" },
  "wall.students": { en: "student{s}", hi: "विद्यार्थी{s}" },
  "wall.extraTime": { en: "extra time", hi: "अधिक समय" },
  "wall.new": { en: "new", hi: "नया" },
  "wall.suggested": { en: "Suggested small groups", hi: "सुझाए गए छोटे समूह" },
  "wall.assessFirst": {
    en: "Assess a few children to form groups.",
    hi: "समूह बनाने के लिए कुछ बच्चों का आकलन करें।",
  },
  "wall.group": { en: "Group {n}", hi: "समूह {n}" },

  /* Classes overview */
  "class.title": { en: "Classes", hi: "कक्षाएँ" },
  "class.subtitle": {
    en: "Your class sections at a glance — then shared skill gaps for everyone.",
    hi: "एक नज़र में आपकी कक्षाएँ — फिर सबके साझा सीखने के अंतराल।",
  },
  "class.grade": { en: "Class {grade}", hi: "कक्षा {grade}" },
  "class.students": { en: "{n} students", hi: "{n} विद्यार्थी" },
  "class.assessed": { en: "{n} assessed", hi: "{n} आकलित" },
  "class.due": { en: "{n} due", hi: "{n} बाकी" },
  "class.allCurrent": { en: "All up to date", hi: "सब ताज़ा हैं" },
  "class.topGaps": { en: "Common gaps", hi: "सामान्य अंतराल" },
  "class.noGaps": { en: "No gaps recorded yet.", hi: "अभी कोई अंतराल दर्ज नहीं हुआ।" },
  "class.empty": { en: "No students in this class yet.", hi: "इस कक्षा में अभी कोई विद्यार्थी नहीं।" },
  "class.addStudent": { en: "Add a student", hi: "विद्यार्थी जोड़ें" },
  "class.back": { en: "Back to classes", hi: "कक्षाओं में वापस" },
  "class.assessGrade": { en: "Assess a student", hi: "विद्यार्थी का आकलन करें" },
  "class.noStudents": {
    en: "No students in Class {grade} yet. Add the first one to start.",
    hi: "कक्षा {grade} में अभी कोई विद्यार्थी नहीं। शुरू करने के लिए पहला विद्यार्थी जोड़ें।",
  },

  /* Assess: category step */
  "assess.category": { en: "Choose a skill area", hi: "कौशल क्षेत्र चुनें" },
  "assess.otherGaps": { en: "Other gap options", hi: "अन्य अंतराल विकल्प" },
  "assess.noStudentsGrade": {
    en: "No students in Class {grade} yet.",
    hi: "कक्षा {grade} में अभी कोई विद्यार्थी नहीं।",
  },

  /* Worksheet preview: activity kinds */
  "wp.read": { en: "Read", hi: "पढ़ो" },
  "wp.write": { en: "Write", hi: "लिखो" },
  "wp.circle": { en: "Circle", hi: "गोला लगाओ" },
  "wp.match": { en: "Match", hi: "मिलाओ" },
  "wp.fill": { en: "Fill in", hi: "भरो" },
  "wp.sequence": { en: "Sequence", hi: "क्रम लगाओ" },
  "wp.solve": { en: "Solve", hi: "हल करो" },

  /* Student detail */
  "sd.history": { en: "Skill-gap history", hi: "अंतराल इतिहास" },
  "sd.noGaps": { en: "No gaps recorded yet.", hi: "अभी कोई अंतराल दर्ज नहीं हुआ।" },
  "sd.reassessNow": { en: "Reassess now", hi: "अभी दोबारा आकलन करें" },
  "sd.improving": { en: "Improving", hi: "सुधार हो रहा है" },
  "sd.stillPresent": { en: "Still present", hi: "अभी भी मौजूद" },
  "sd.firstNoticed": { en: "First noticed {date}", hi: "पहली बार {date} को दिखा" },
  "sd.lastSample": { en: "Last sample {date}", hi: "आखिरी नमूना {date} को" },
  "sd.drills": {
    en: "{n} drill{s} generated · currently tier {tier}",
    hi: "{n} अभ्यास बने · अभी स्तर {tier}",
  },
  "sd.closed": { en: "Closed on {date}", hi: "{date} को बंद हुआ" },
  "sd.stillOpen": {
    en: "Still open · next listen by {date}",
    hi: "अभी खुला है · अगला आकलन {date} तक",
  },
  "sd.reassess": { en: "Reassess", hi: "दोबारा आकलन" },
  "sd.markResolved": { en: "Mark resolved", hi: "हल हो चुका चिह्नित करें" },
  "sd.harderDrill": { en: "Still struggling · harder drill", hi: "अभी भी कठिनाई · और कठिन अभ्यास" },
  "sd.openSheet": { en: "Open “{title}”", hi: "“{title}” खोलें" },
  "sd.assessments": { en: "Assessments", hi: "आकलन" },
  "sd.noneYet": { en: "None yet.", hi: "अभी कोई नहीं।" },
  "sd.remove": { en: "Remove student from this phone", hi: "इस फ़ोन से विद्यार्थी हटाएँ" },
  "sd.notFound": { en: "Student not found.", hi: "विद्यार्थी नहीं मिला।" },
  "sd.goHome": { en: "Go home", hi: "मुख्य पृष्ठ" },
  "sd.edit": { en: "Edit", hi: "संपादित करें" },
  "sd.assess": { en: "Assess", hi: "आकलन" },
  "sd.gapClosed": {
    en: "Gap closed. This student can return to the usual rotation.",
    hi: "अंतराल बंद हुआ। यह विद्यार्थी सामान्य चक्र में लौट सकता है।",
  },
  "sd.extraDrill": {
    en: "Still open — a slightly fuller drill was added.",
    hi: "अभी खुला है — थोड़ा बड़ा अभ्यास जोड़ा गया।",
  },
  "sd.noTemplate": {
    en: "Still open. No extra template was available for this tier.",
    hi: "अभी खुला है। इस स्तर के लिए कोई और टेम्पलेट उपलब्ध नहीं था।",
  },
  "sd.confirmRemove": {
    en: "Remove {name} from this phone?",
    hi: "{name} को इस फ़ोन से हटाएँ?",
  },

  /* Student form */
  "sf.edit": { en: "Edit student", hi: "विद्यार्थी संपादित करें" },
  "sf.add": { en: "Add a student", hi: "विद्यार्थी जोड़ें" },
  "sf.name": { en: "Name", hi: "नाम" },
  "sf.grade": { en: "Grade", hi: "कक्षा" },
  "sf.class1": { en: "Class 1", hi: "कक्षा 1" },
  "sf.class2": { en: "Class 2", hi: "कक्षा 2" },
  "sf.class3": { en: "Class 3", hi: "कक्षा 3" },
  "sf.roll": { en: "Roll / local ID", hi: "रोल / स्थानीय पहचान" },
  "sf.avatarColor": { en: "Avatar colour", hi: "अवतार रंग" },
  "sf.saveChanges": { en: "Save changes", hi: "बदलाव सहेजें" },
  "sf.saveStudent": { en: "Save student", hi: "विद्यार्थी सहेजें" },

  /* Status badges */
  "sb.persistent": { en: "Needs extra time", hi: "अधिक समय चाहिए" },
  "sb.watch": { en: "Keep practising", hi: "अभ्यास जारी रखें" },
  "sb.new": { en: "Newly noticed", hi: "नया पहचाना गया" },
  "sb.closed": { en: "Closed", hi: "बंद" },

  /* Diagnosis summaries (domain) */
  "diag.noMarks": {
    en: "No specific errors were marked on this sample. You can choose a gap from the list, or save this as a clear sample.",
    hi: "इस नमूने में कोई विशेष गलती चिह्नित नहीं हुई। आप सूची से अंतराल चुन सकते हैं, या इसे स्पष्ट नमूने के रूप में सहेज सकते हैं।",
  },
  "diag.pattern": {
    en: "Heard a pattern matching “{label}”.",
    hi: "“{label}” से मिलता पैटर्न सुना गया।",
  },
  "diag.noMatch": {
    en: "Marks were noted, but they did not map cleanly to a named gap. You can pick one from the list.",
    hi: "गलतियाँ चिह्नित हुईं, पर वे किसी नामित अंतराल से साफ़ नहीं मिलीं। आप सूची में से एक चुन सकते हैं।",
  },

  /* Small-group suggestions (domain) */
  "sg.persistent": {
    en: "{n} students · extra time needed (3+ weeks)",
    hi: "{n} विद्यार्थी · अधिक समय चाहिए (3+ सप्ताह)",
  },
  "sg.watch": {
    en: "{n} students · keep practising together",
    hi: "{n} विद्यार्थी · साथ अभ्यास जारी रखें",
  },
  "sg.new": {
    en: "{n} students · newly noticed this week",
    hi: "{n} विद्यार्थी · इस सप्ताह नया पहचाना गया",
  },

  /* NotFound */
  "nf.title": { en: "This page is not in Sahayak", hi: "यह पृष्ठ Sahayak में नहीं है" },
  "nf.body": {
    en: "Head back to your class overview.",
    hi: "अपनी कक्षा के मुख्य पृष्ठ पर लौटें।",
  },
  "nf.home": { en: "Home", hi: "मुख्य" },
} as const;

export function t(
  lang: Language,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const entry = (STRINGS as Record<string, { en: string; hi: string }>)[key];
  let out = entry ? entry[lang] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

/** English fallback for content objects that carry optional Hindi fields. */
function pick<T>(en: T, hi: T | undefined, lang: Language): T {
  return lang === "hi" && hi !== undefined ? hi : en;
}

export function localizedPrompt(
  prompt: AssessmentPrompt,
  lang: Language,
): AssessmentPrompt {
  if (lang === "en") return prompt;
  return {
    ...prompt,
    title: pick(prompt.title, prompt.titleHi, lang),
    instruction: pick(prompt.instruction, prompt.instructionHi, lang),
    displayText: pick(prompt.displayText, prompt.displayTextHi, lang),
    tokens: pick(prompt.tokens, prompt.tokensHi, lang),
  };
}

export function localizedTemplate(
  template: WorksheetTemplate,
  lang: Language,
): WorksheetTemplate {
  if (lang === "en") return template;
  return {
    ...template,
    title: pick(template.title, template.titleHi, lang),
    focus: pick(template.focus, template.focusHi, lang),
    items: pick(template.items, template.itemsHi, lang),
  };
}

export function localizedSheet(
  sheet: WorksheetInstance,
  lang: Language,
): WorksheetInstance {
  if (lang === "en") return sheet;
  return {
    ...sheet,
    title: pick(sheet.title, sheet.titleHi, lang),
    focus: pick(sheet.focus, sheet.focusHi, lang),
    items: pick(sheet.items, sheet.itemsHi, lang),
  };
}

export function localizedGapType(
  gap: CompetencyGapType,
  lang: Language,
): CompetencyGapType {
  if (lang === "en") return gap;
  return {
    ...gap,
    label: pick(gap.label, gap.labelHi, lang),
    description: pick(gap.description, gap.descriptionHi, lang),
  };
}