# SAH-PS-2 — Foundational Learning Assessment & Practice Platform

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
