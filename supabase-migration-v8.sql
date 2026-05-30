-- ============================================
-- Guitar Studio - Migration v8
-- Run in Supabase SQL editor
-- ============================================

-- Temporary files attached to student profiles (auto-expire after 7 days)
create table if not exists student_files (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  file_type text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists student_files_student_idx on student_files(student_id);
create index if not exists student_files_expires_idx on student_files(expires_at);

-- ============================================
-- SUPABASE STORAGE SETUP (do this in dashboard)
-- ============================================
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Name it: student-files
-- 4. Leave "Public bucket" UNCHECKED (files served via signed URLs)
-- 5. Click Create
-- ============================================
