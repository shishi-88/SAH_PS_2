# Sahayak (SAH-PS-2) — Offline-First Foundational Literacy & Numeracy Platform

> **A teacher-first, offline-first educational diagnostic and practice platform for Classes 1–3, aligned with NIPUN Bharat competencies.**

---

## 🌟 Architecture & Highlights

Sahayak transforms early-grade assessment from stressful, high-stakes testing into continuous, actionable learning support:
- **Teacher-First Mobile App**: Designed for classroom tablets and smartphones with touch-friendly controls, quick oral and numeracy assessment checklists, daily rotation queues, and printable tiered worksheets.
- **Multi-Page Central Web Portal**: Dedicated routes (`/dashboard`, `/roster`, `/analytics`, `/admin`, `/reports`) for headmasters and block education officers to monitor cohort competency gaps, review sync logs, and batch-download practice sheets.
- **Offline-First Resilience**: All core classroom features run with **zero internet connection**. Assessment logs and student records are persisted locally in IndexedDB wrapped in client-side AES-GCM encryption.
- **Multi-Teacher Workspaces & Quick Switch**: Dedicated teacher login and authentication with 1-click demo teacher switching between classrooms (**Prerna Sharma** & **Rajesh Verma**) to demonstrate multi-teacher multi-classroom workflows.
- **Bi-Directional Real Data Sync**: Export encrypted offline sync bundles as JSON, import locally into the central portal with full entity merging, or sync automatically when an internet connection becomes available.

---

## 🛠️ Complete Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite 8 | Reactive, type-safe single-page application with lightning-fast HMR and production bundle optimization. |
| **Routing & Navigation** | React Router 6 | Multi-page routing supporting clean deep URLs (`/mobile`, `/dashboard`, `/roster`, `/analytics`, `/admin`, `/reports`, `/mobile/login`). |
| **Styling & Design System** | Tailwind CSS, Radix UI primitives, Lucide Icons | Responsive mobile-first and desktop portal layouts with accessible contrast, custom badge pills, and dark/light themes. |
| **Client Storage & Vault** | IndexedDB (`idb-keyval`), Web Crypto API (SubtleCrypto AES-GCM) | Local-first persistence ensuring zero data loss offline, encrypting student records before writing to disk. |
| **Document Generation** | JSZip, HTML5 Print Stylesheets | In-browser dynamic HTML worksheet rendering with CSS print media formatting and multi-sheet ZIP archive compilation. |
| **Backend & API Server** | Node.js, Express 5, TypeScript | Lightweight RESTful microservices for teacher authentication, classroom session issuance, and sync queue processing. |
| **Cloud Database Mirroring** | Supabase (PostgreSQL) with in-memory resilient fallback | Cloud sync ingestion for aggregate educational metrics with automatic offline failover when cloud database is unreachable. |
| **Testing & Quality** | Vitest, TypeScript Compiler (`tsc --noEmit`) | Rigorous test coverage across rotation algorithms, competency diagnosis, worksheet banks, sync conflict resolution, and authentication. |

---

## 📱 Mobile App Capabilities

1. **Teacher Login & Switch Teacher**:
   - Secure teacher login ID and password authentication (`teacher123`).
   - 1-Click quick login for demo teachers:
     - **Prerna Sharma** (GPS-104 Primary Section, Classes 1–3)
     - **Rajesh Verma** (Bal Vidyalaya Section B, Class 2)
   - Real-time **Switch Teacher** feature accessible directly from the mobile top navigation header and home screen banner.
2. **Foundational Reading Assessment**:
   - Letter sound recognition, word decoding, passage comprehension.
   - Token-level error marking (wrong, hesitation, skipped) with optional Web Speech assistance.
3. **Foundational Numeracy Assessment**:
   - Number recognition (1–9, 10–99), counting sequences, missing number grids, and decade transitions.
4. **Learning Gap Diagnostic Engine**:
   - Rule-based, deterministic mapping of student observations to specific NIPUN Bharat competency gaps.
   - Automatic tier assignment (Tier 1 Foundational → Tier 2 Guided Practice → Tier 3 Independent Mastery).
5. **Classroom Rotation Queue**:
   - Automatically calculates daily assessment quotas (e.g. 5 students/day) to complete full class rounds every 14 days without teacher burnout.
6. **Practice Worksheets**:
   - Tiered printable practice worksheets generated instantly when a learning gap is identified.

---

## 🖥️ Central Web Portal Capabilities

1. **Executive Dashboard (`/dashboard`)**:
   - Cohort FLN health score, active gap distribution, total enrolled students, and sync status telemetry.
2. **Roster Management (`/roster`)**:
   - Real-time student roster editor with class filters, grade filters, roll numbers, and avatar color accents.
3. **Competency Analytics (`/analytics`)**:
   - Graphical visualizations of learning gaps across reading and numeracy competencies with tier breakdowns.
4. **Worksheet Bank & Batch ZIP Download**:
   - Live worksheet bank with multi-attribute filtering (Subject, Grade 1–3, Tier 1–3).
   - Batch selection and 1-Click **Download Selected as ZIP** compiling full class sets of printable HTML worksheets into a single compressed `.zip` bundle.
5. **Sync Audit Logs (`/admin`)**:
   - Real-time tracking of sync operations, device IDs, conflicting updates, and batch ingest records.

---

## 🔄 Offline Synchronization Flow

```text
[Teacher Mobile App (Offline)]
      │
      ├─ 1. Conducts assessments & diagnoses gaps
      ├─ 2. Stores in AES-GCM encrypted local IndexedDB
      ├─ 3. Generates Offline Sync Bundle (JSON)
      │
      ▼
[Network Available / USB Transfer]
      │
      ├─ 4. POST /api/sync/pull (Online automatic sync)
      │     OR Import Offline Bundle JSON in Portal
      │
      ▼
[Central Store / Supabase Postgres]
      │
      ├─ 5. Reconciles versions & updates records
      ├─ 6. Updates portal KPI analytics & roster in real time
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/shishi-88/SAH_PS_2.git
cd SAH_PS_2

# Install dependencies
npm install
```

### Running in Development
```bash
# Start Vite dev server on port 8082
npx vite --port 8082
```
- Open [http://localhost:8082](http://localhost:8082) for the **Central Web Portal**.
- Open [http://localhost:8082/mobile](http://localhost:8082/mobile) for the **Teacher Mobile App**.
- Open [http://localhost:8082/mobile/login](http://localhost:8082/mobile/login) for the **Teacher Login & Switch Screen**.

### Demo Credentials
- **Password for all teachers**: `teacher123`
- **Teacher 1**: `Prerna Sharma` (GPS-104 Primary School)
- **Teacher 2**: `Rajesh Verma` (Bal Vidyalaya Section B)
- **Portal Admin**: `admin` / `admin123`

### Running Automated Tests
```bash
# Run Vitest test suite
npm test

# Type-check TypeScript codebase
npx tsc --noEmit
```

### Production Build
```bash
# Build production client and server bundles
npm run build
```

---

## 📄 License
Aligned with public education guidelines under the NIPUN Bharat Mission. All rights reserved.
