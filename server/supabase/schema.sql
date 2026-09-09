-- ====================================================================
-- SAHAYAK (SAH-PS-2) SUPABASE DATABASE SCHEMA
-- Classes 1–3 Foundational Literacy & Numeracy Assessment Platform
-- ====================================================================

-- 1. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  school_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Classrooms Table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade_band TEXT NOT NULL DEFAULT 'Classes 1-3',
  students_per_day INTEGER NOT NULL DEFAULT 5,
  reassessment_days INTEGER NOT NULL DEFAULT 14,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL DEFAULT 1,
  roll_no TEXT NOT NULL,
  avatar_tint TEXT NOT NULL DEFAULT 'teal',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  last_assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  class_id TEXT,
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL,
  prompt_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'initial',
  related_gap_id TEXT,
  detected_gap_type_ids TEXT[] NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL DEFAULT '{"observations":[]}',
  analysis_source TEXT NOT NULL DEFAULT 'teacher-assisted',
  summary TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Learning Gaps Table
CREATE TABLE IF NOT EXISTS learning_gaps (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  gap_type_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_tier INTEGER NOT NULL DEFAULT 1,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  reassessment_due_at TIMESTAMPTZ NOT NULL,
  worksheet_ids TEXT[] NOT NULL DEFAULT '{}',
  assessment_ids TEXT[] NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Central Sync Audit Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  client_id TEXT,
  status TEXT NOT NULL,
  client_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER NOT NULL DEFAULT 1,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details TEXT
);

-- Enable Row Level Security (RLS) on all tables with public policies for school devices
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on teachers" ON teachers FOR ALL USING (true);

CREATE POLICY "Allow public read on classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on classes" ON classes FOR ALL USING (true);

CREATE POLICY "Allow public read on students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on students" ON students FOR ALL USING (true);

CREATE POLICY "Allow public read on assessments" ON assessments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on assessments" ON assessments FOR ALL USING (true);

CREATE POLICY "Allow public read on learning_gaps" ON learning_gaps FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on learning_gaps" ON learning_gaps FOR ALL USING (true);

CREATE POLICY "Allow public read on sync_logs" ON sync_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sync_logs" ON sync_logs FOR INSERT WITH CHECK (true);

