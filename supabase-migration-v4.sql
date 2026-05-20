-- ============================================
-- Guitar Studio - Migration v4
-- Run in Supabase SQL editor
-- ============================================

-- Resources library
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  resource_type text not null default 'Other'
    check (resource_type in ('PDF', 'Video', 'Article', 'Chord Chart', 'Exercise', 'Backing Track', 'Other')),
  source_type text not null default 'link'
    check (source_type in ('link', 'upload')),
  url text,                    -- for links
  file_path text,              -- for uploads (Supabase storage path)
  file_name text,              -- original filename for display
  file_size integer,           -- bytes
  tags text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Student resource assignments
create table if not exists student_resources (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  note text,
  unique (student_id, resource_id)
);

create index if not exists student_resources_student_idx on student_resources(student_id);
create index if not exists student_resources_resource_idx on student_resources(resource_id);

-- ============================================
-- SUPABASE STORAGE SETUP (do this in dashboard)
-- ============================================
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Name it: resources
-- 4. Check "Public bucket" (so files are accessible via URL)
-- 5. Click Create
--
-- That's it. The app handles the rest.
-- ============================================
