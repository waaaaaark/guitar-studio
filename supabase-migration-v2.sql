-- ============================================
-- Guitar Studio - Migration v2
-- Run this in your Supabase SQL editor
-- Safe to run on existing data
-- ============================================

-- Add new fields to students table
alter table students
  add column if not exists student_profile text check (student_profile in ('Child', 'Teen', 'Adult')) default 'Teen',
  add column if not exists belt_system_active boolean not null default true,
  add column if not exists belt text not null default 'White',
  add column if not exists belt_stripes integer not null default 0,
  add column if not exists total_xp integer not null default 0,
  add column if not exists current_stripe_xp integer not null default 0,
  add column if not exists stripe_eligible boolean not null default false,
  add column if not exists belt_eligible boolean not null default false,
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_practice_date date,
  add column if not exists total_practice_minutes integer not null default 0;

-- Song tags
create table if not exists song_tags (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (song_id, tag)
);
create index if not exists song_tags_tag_idx on song_tags(tag);
create index if not exists song_tags_song_idx on song_tags(song_id);

-- Practice sessions
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  session_date date not null default current_date,
  duration_minutes integer not null,
  xp_earned integer not null default 0,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists practice_sessions_student_idx on practice_sessions(student_id);
create index if not exists practice_sessions_date_idx on practice_sessions(session_date);

-- XP audit log
create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  amount integer not null,
  reason text not null,
  event_type text not null check (event_type in ('practice', 'song_mastery', 'manual_award', 'manual_deduct', 'stripe_earn', 'belt_earn')),
  created_at timestamptz not null default now()
);
create index if not exists xp_events_student_idx on xp_events(student_id);

-- Student song mastery status
alter table student_songs
  add column if not exists mastery_status text not null default 'working'
    check (mastery_status in ('working', 'eligible', 'mastered')),
  add column if not exists mastered_at date;

-- Stripe XP thresholds by belt (for reference)
-- White stripes: 2500 XP each
-- Blue stripes: 4000 XP each
-- Purple stripes: 6000 XP each
-- Brown stripes: 8000 XP each

-- Daily XP cap tracking
create table if not exists daily_xp_caps (
  student_id uuid not null references students(id) on delete cascade,
  cap_date date not null default current_date,
  minutes_logged integer not null default 0,
  primary key (student_id, cap_date)
);
