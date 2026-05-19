-- ============================================
-- Guitar Studio - Migration
-- Run this in your Supabase SQL editor
-- Safe to run on existing data
-- ============================================

-- Teachers table
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

-- Insert Brendan as the default teacher
insert into teachers (name, email)
values ('Brendan', null)
on conflict do nothing;

-- Add teacher_id to students (nullable for now, so existing rows don't break)
alter table students
  add column if not exists teacher_id uuid references teachers(id) on delete set null;

-- Set all existing students to Brendan's teacher_id
update students
set teacher_id = (select id from teachers where name = 'Brendan' limit 1)
where teacher_id is null;

-- Add teacher_id to lessons (nullable for now)
alter table lessons
  add column if not exists teacher_id uuid references teachers(id) on delete set null;

-- Set all existing lessons to Brendan's teacher_id
update lessons
set teacher_id = (select id from teachers where name = 'Brendan' limit 1)
where teacher_id is null;

-- Add time_slot to students for future scheduling (nullable, no-op for now)
alter table students
  add column if not exists day_of_week text,
  add column if not exists lesson_time text;
