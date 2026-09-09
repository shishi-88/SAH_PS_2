# SAH-PS-2 — Implementation Status & Architecture Assessment

## Architecture Assessment

- **Product**: Sahayak (SAH-PS-2) — Teacher-first, offline-first foundational reading & numeracy assessment platform for Classes 1–3.
- **Frontend Stack**: React 18 + TypeScript + Vite + TailwindCSS + Lucide Icons + React Router.
- **Local Persistence**: Client-side storage (IndexedDB / LocalStorage) with optional Web Crypto encryption for zero-network operation.
- **Diagnostic Philosophy**: Deterministic rule-based diagnosis of observable educational skill gaps (no opaque clinical ML, no mark-based competitive ranking).
- **Practice Architecture**: Tagged pre-built worksheet templates matched to skill gaps with tiered progression (Tier 1 → Tier 2 → Tier 3).
- **Privacy & Sync**: Anonymized aggregated gap metrics transmitted to the reporting server when connectivity is available; zero student PII leaves the local device.

---

## Core Feature Checklist

- [x] **1. Project Foundation & Architecture Shell**
  - Teacher-first mobile-optimized interface with bottom navigation.
  - Offline status indicator and multilingual support (English & Hindi).
  - Production-ready Vite build and TypeScript target ES2022.

- [x] **2. Student Records & Profiles**
  - Add, edit, view, and remove student profiles (Roll No, Grade, Name, Avatar Tint).
  - Chronological learning gap history and assessment timeline.
  - Quick action assessment triggers from profile.

- [x] **3. Foundational Reading Assessment**
  - Teacher-guided reading prompts covering letter, sound, word decoding, and passage reading.
  - Token-level mistake recording (wrong, skipped, hesitation).
  - Optional assistive Web Speech API integration.

- [x] **4. Foundational Numeracy Assessment**
  - Number recognition, counting sequences, missing numbers, and transitions.
  - Concrete step-by-step observable competency checks.

- [x] **5. Learning Gap Engine**
  - Extensible competency registry across reading and numeracy.
  - Rule-based diagnosis based on observed error patterns.
  - Gap lifecycle management: `NEW` → `ACTIVE` → `IMPROVING` → `RESOLVED`.

- [x] **6. Targeted Practice Worksheet Bank**
  - Curated worksheet template bank mapped to competency gap types.
  - Automatic tier-based worksheet generation upon gap detection.
  - Clean printable worksheets for offline classroom practice.

- [x] **7. Reassessment Workflow**
  - Direct reassessment link for active learning gaps.
  - Historical comparison and resolution state tracking.
  - Escalation to higher drill tiers if difficulty persists.

- [x] **8. Class-Level Gap Aggregation**
  - Aggregation of common learning gaps across the cohort.
  - Gap wall prioritizing persistent gaps over newly noticed ones.
  - Zero competitive student ranking or leaderboards.

- [x] **9. Small-Group Interventions**
  - Automatic suggested grouping based on shared skill gaps.
  - Group size limits and clear pedagogical focus.

- [x] **10. Assessment Rotation**
  - Daily rotation queue calculating students-per-day targets.
  - School days countdown and rotation completion tracking.

- [x] **11. Offline-First Operation & Storage**
  - Fully functional offline CRUD via browser storage.
  - Service worker caching shell for progressive web app behavior.

- [x] **12. Privacy & Anonymized Sync**
  - Client-side data minimization.
  - Anonymized aggregate payload queue for sync without individual student identities.
  - Server endpoints receiving aggregate cohort reports.

- [x] **13. Verification & Automated Tests**
  - Vitest test suite covering rotation, diagnosis, worksheet bank, and class overview.
  - Clean TypeScript compilation with 0 errors.


> **Offline-First Smart Education Platform for Foundational Reading & Numeracy Assessment in Classes 1–3.**

---

## Project Summary

SAH-PS-2 is a teacher-focused educational platform designed to assess foundational reading and numeracy skills in students from Classes 1–3.

Instead of focusing primarily on marks or scores, the platform identifies **specific learning gaps**, provides targeted practice material, and tracks student progress through reassessment.

The application is designed around an **offline-first architecture**, allowing teachers to continue using the core assessment and learning-support features even when internet connectivity is unavailable.

The platform combines:

- **Foundational Reading Assessment**: Short teacher-guided assessments for early reading skills, including words, sounds, passages, and response patterns.
- **Foundational Numeracy Assessment**: Structured activities for number recognition, sequences, transitions, and other early numeracy competencies.
- **Specific Learning-Gap Diagnosis**: Converts assessment observations into actionable learning gaps rather than relying only on numerical scores.
- **Individual Student Records**: Persistent student profiles containing assessment history, identified gaps, practice activities, and reassessment outcomes.
- **Individualized Practice Worksheets**: Selects targeted worksheets from a pre-built, tagged template bank based on the student's diagnosed gap.
- **Class-Level Gap Aggregation**: Groups common learning gaps across students and suggests small-group intervention priorities without displaying student rankings.
- **Assessment Rotation**: Helps teachers distribute assessments across the class through a manageable daily rotation.
- **Reassessment Tracking**: Allows teachers to reassess previously identified gaps and track whether they have been resolved.
- **Offline-First Operation**: Core classroom functionality remains available without an active internet connection.
- **Anonymized Aggregate Synchronization**: When connectivity is available, aggregate learning-gap information can be synchronized for broader educational reporting without requiring individual student identity.

---

## Problem Statement

Foundational literacy and numeracy are critical during the early years of education. However, conventional assessments often provide a score without clearly identifying the underlying skill gap.

A teacher may know that a student is struggling, but still need answers to questions such as:

- Which specific foundational skill is causing the difficulty?
- What should the student practice next?
- Is the same gap affecting multiple students?
- Has a previously identified gap been resolved?
- Which students could benefit from a small-group intervention?

SAH-PS-2 addresses this by transforming classroom assessment into a continuous learning-support cycle:

```text
Assessment
    ↓
Specific Gap Diagnosis
    ↓
Targeted Practice
    ↓
Reassessment
    ↓
Progress Tracking
    ↓
Class-Level Intervention
