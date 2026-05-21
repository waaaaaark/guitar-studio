-- ============================================
-- Guitar Studio - Migration v5
-- Run in Supabase SQL editor
-- ============================================

-- App settings (single row)
create table if not exists app_settings (
  id integer primary key default 1 check (id = 1), -- enforces single row
  studio_name text not null default 'Brendan''s Guitar Studio',
  admin_email text,
  default_lesson_frequency text not null default 'Weekly',
  default_student_profile text not null default 'Teen',
  daily_practice_xp_cap integer not null default 120,
  session_max_minutes integer not null default 90,
  stripe_requirement_mode text not null default 'both'
    check (stripe_requirement_mode in ('xp_only', 'checklist_only', 'both')),
  updated_at timestamptz not null default now()
);

-- Insert default settings row
insert into app_settings (id) values (1) on conflict do nothing;

-- Student page view tracking
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text
);

create index if not exists page_views_student_idx on page_views(student_id);
create index if not exists page_views_date_idx on page_views(viewed_at);
