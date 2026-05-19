-- ============================================
-- Guitar Studio - Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Students table
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  skill_level text check (skill_level in ('Beginner', 'Intermediate', 'Advanced')) default 'Beginner',
  lesson_frequency text check (lesson_frequency in ('Weekly', 'Bi-weekly', 'Monthly')) default 'Weekly',
  start_date date not null default current_date,
  lesson_count integer not null default 0,
  admin_notes text,
  active boolean not null default true,
  inactive_date date,
  created_at timestamptz not null default now()
);

-- Songs library (shared across all students)
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  created_at timestamptz not null default now(),
  unique (title, artist)
);

-- Lessons table
create table lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  lesson_date date not null default current_date,
  what_we_covered text not null,
  focus_for_week text not null,
  created_at timestamptz not null default now()
);

-- Songs worked on per lesson
create table lesson_songs (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  unique (lesson_id, song_id)
);

-- Student repertoire (all songs ever worked on with a student)
create table student_songs (
  student_id uuid not null references students(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  first_worked_on date not null default current_date,
  primary key (student_id, song_id)
);

-- Function to auto-increment lesson count when a lesson is added
create or replace function increment_lesson_count()
returns trigger as $$
begin
  update students set lesson_count = lesson_count + 1
  where id = new.student_id;
  return new;
end;
$$ language plpgsql;

create trigger on_lesson_insert
  after insert on lessons
  for each row execute function increment_lesson_count();

-- Function to decrement lesson count when a lesson is deleted
create or replace function decrement_lesson_count()
returns trigger as $$
begin
  update students set lesson_count = greatest(lesson_count - 1, 0)
  where id = old.student_id;
  return old;
end;
$$ language plpgsql;

create trigger on_lesson_delete
  after delete on lessons
  for each row execute function decrement_lesson_count();

-- RLS: disable for simplicity (you control access via API routes + admin password)
alter table students disable row level security;
alter table songs disable row level security;
alter table lessons disable row level security;
alter table lesson_songs disable row level security;
alter table student_songs disable row level security;
