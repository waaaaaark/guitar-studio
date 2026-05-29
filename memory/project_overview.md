---
name: project-overview
description: Guitar Studio app overview — purpose, tech stack, key data model, and admin structure
metadata:
  type: project
---

Guitar Studio is a Next.js 16 + Supabase (PostgreSQL) web app for managing private guitar lessons. Teacher-facing admin panel, student-facing secret-URL pages (no login).

**Why:** Tracks students, lessons, song repertoire, XP/belt progression, practice streaks, and emailed lesson summaries.

**How to apply:** Assume Supabase is the sole data store; API routes in `app/api/` are Next.js Route Handlers; admin auth via `checkAdminAuth()` in `lib/auth.ts`.

Key tables: `students`, `songs`, `song_tags`, `student_songs` (repertoire), `lessons`, `lesson_songs`, `belt_requirements`, `practice_sessions`, `xp_events`, `resources`.

Songs library is shared across all students. `lesson_songs` and `student_songs` both have `ON DELETE CASCADE` on `song_id`, so deleting a song auto-cleans those. `song_tags` has no guaranteed cascade and must be deleted explicitly first.

Main admin UI components: `app/admin/SongsLibrary.tsx`, `StudentDetail.tsx`, `CurriculumEditor.tsx`, `AnalyticsPage.tsx`.
