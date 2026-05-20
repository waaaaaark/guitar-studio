-- ============================================
-- Guitar Studio - Migration v3
-- Run in Supabase SQL editor
-- Safe to run on existing data
-- ============================================

-- Belt requirements (static curriculum)
create table if not exists belt_requirements (
  id uuid primary key default gen_random_uuid(),
  belt text not null,
  stripe integer not null, -- 1-4, which stripe this requirement gates
  requirement text not null,
  sort_order integer not null default 0
);

-- Student requirement completions
create table if not exists student_requirements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  requirement_id uuid not null references belt_requirements(id) on delete cascade,
  completed boolean not null default false,
  completed_at date,
  note text,
  unique (student_id, requirement_id)
);
create index if not exists student_req_student_idx on student_requirements(student_id);

-- Practice tips
create table if not exists practice_tips (
  id uuid primary key default gen_random_uuid(),
  tip_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Seed belt requirements ──────────────────────────────

-- WHITE BELT
-- Stripe 1
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('White', 1, 'Holds the guitar with correct posture', 1),
  ('White', 1, 'Knows at least 3 open chords (e.g. G, C, D or E, A, D)', 2),
  ('White', 1, 'Can switch between 2 chords slowly without stopping', 3),
  ('White', 1, 'Understands basic rhythm — can clap or strum on the beat', 4);

-- Stripe 2
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('White', 2, 'Knows 4-5 open chords cleanly', 1),
  ('White', 2, 'Can reproduce a strumming pattern demonstrated by the teacher', 2),
  ('White', 2, 'Beginning single-note playing on one string', 3),
  ('White', 2, 'Understands what a key is', 4),
  ('White', 2, 'Can play a simple song recognizably from start to finish', 5);

-- Stripe 3
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('White', 3, 'Chord transitions are becoming fluid and consistent', 1),
  ('White', 3, 'Basic fingerpicking or picking technique emerging', 2),
  ('White', 3, 'Can learn a simple new song with minimal guidance', 3),
  ('White', 3, 'Plays with consistent rhythm — does not stop mid-song to fix chords', 4);

-- Stripe 4
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('White', 4, 'Solid open chord vocabulary — 6+ chords', 1),
  ('White', 4, 'Understands basic song structure (verse, chorus)', 2),
  ('White', 4, 'Actively working on barre chords — F or Bm attempted', 3),
  ('White', 4, 'Plays musically, not just mechanically', 4),
  ('White', 4, 'Can play 2-3 songs well enough to perform for someone', 5);

-- BLUE BELT
-- Stripe 1
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Blue', 1, 'Barre chords functional and reliable (F, Bm usable in context)', 1),
  ('Blue', 1, 'Knows the pentatonic minor scale in position 1', 2),
  ('Blue', 1, 'Plays with dynamics — can vary volume and intensity intentionally', 3),
  ('Blue', 1, 'Understands the difference between major and minor tonality', 4);

-- Stripe 2
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Blue', 2, 'Barre chords reliable across multiple positions', 1),
  ('Blue', 2, 'Can improvise simple phrases over a static chord', 2),
  ('Blue', 2, 'Basic music theory — major scale, intervals', 3),
  ('Blue', 2, 'Understands the I, IV, V relationship', 4);

-- Stripe 3
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Blue', 3, 'Plays comfortably in at least 2 scale positions', 1),
  ('Blue', 3, 'Understands the number system — can identify I IV V in a song', 2),
  ('Blue', 3, 'Has some blues vocabulary — bends, slides, or vibrato', 3),
  ('Blue', 3, 'Rhythm playing is solid and musical', 4);

-- Stripe 4
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Blue', 4, 'Can figure out simple songs by ear without tabs', 1),
  ('Blue', 4, 'Understands keys and can identify what key a song is in', 2),
  ('Blue', 4, 'Plays lead and rhythm with confidence', 3),
  ('Blue', 4, 'Can transpose a simple song to a different key', 4),
  ('Blue', 4, 'Strong sense of musicality — plays with feel, not just notes', 5);

-- PURPLE BELT
-- Stripe 1
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Purple', 1, 'Extended chords — 7ths, 9ths, sus chords used musically', 1),
  ('Purple', 1, 'Multiple scale positions connected across the neck', 2),
  ('Purple', 1, 'Plays with genuine personal feel and style', 3),
  ('Purple', 1, 'Strong ear — can identify chord types by sound', 4);

-- Stripe 2
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Purple', 2, 'Understands modes at least conceptually', 1),
  ('Purple', 2, 'Can solo over a chord progression with intention and direction', 2),
  ('Purple', 2, 'Strong rhythm playing — can hold down a groove reliably', 3),
  ('Purple', 2, 'Beginning to understand chord function, not just shape', 4);

-- Stripe 3
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Purple', 3, 'Can solo over diatonic chord changes (chords within the same key)', 1),
  ('Purple', 3, 'Strong improvisation within a key', 2),
  ('Purple', 3, 'Understands song form at a deeper level — can analyze a song', 3),
  ('Purple', 3, 'Plays with phrasing — notes breathe, not just continuous running', 4);

-- Stripe 4
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Purple', 4, 'Solid music theory foundation', 1),
  ('Purple', 4, 'Fluent in both lead and rhythm roles', 2),
  ('Purple', 4, 'Can learn complex songs independently', 3),
  ('Purple', 4, 'Demonstrates clear musical identity and preferences', 4);

-- BROWN BELT
-- Stripe 1
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Brown', 1, 'Can solo meaningfully over disparate chord changes', 1),
  ('Brown', 1, 'Strong ear training — transcribes by ear with accuracy', 2),
  ('Brown', 1, 'Plays with a distinctive personal voice', 3),
  ('Brown', 1, 'Advanced technique — vibrato, bends, legato, etc. are refined', 4);

-- Stripe 2
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Brown', 2, 'Advanced harmony — jazz chords, altered chords, chord melody', 1),
  ('Brown', 2, 'Composition ability — can write original music', 2),
  ('Brown', 2, 'Understands and can play in multiple styles', 3),
  ('Brown', 2, 'Deep understanding of the fretboard — no mystery positions', 4);

-- Stripe 3
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Brown', 3, 'Plays multiple styles convincingly', 1),
  ('Brown', 3, 'Can teach basic concepts to others clearly', 2),
  ('Brown', 3, 'Strong sight-reading or advanced by-ear ability', 3),
  ('Brown', 3, 'Music theory is internalized — not just known, but heard', 4);

-- Stripe 4
insert into belt_requirements (belt, stripe, requirement, sort_order) values
  ('Brown', 4, 'Near-complete guitarist — depth and refinement remain', 1),
  ('Brown', 4, 'Plays with total confidence in any musical situation', 2),
  ('Brown', 4, 'Has a body of repertoire spanning multiple styles', 3),
  ('Brown', 4, 'Black belt conversation has begun', 4);

-- ── Seed practice tips ──────────────────────────────────
insert into practice_tips (tip_text) values
  ('Start slow, then speed up. Accuracy first, tempo second.'),
  ('Record yourself once a week — you''ll hear things you can''t feel.'),
  ('Struggling with a chord change? Isolate just those two chords for 3 minutes.'),
  ('Warming up? Try scales or finger exercises before diving into songs.'),
  ('If a section keeps tripping you up, slow it down until you can play it perfectly 5 times in a row.'),
  ('Learn the song you actually want to play — motivation beats method.'),
  ('Use a metronome during practice. Even if it feels rigid, it''s building something real.'),
  ('Short focused sessions beat long unfocused ones. 20 minutes of real practice is worth more than an hour of noodling.'),
  ('Your fretting hand should be relaxed, not tense. If it hurts, stop and reset.'),
  ('Practice the hard part, not just the parts you already know.'),
  ('Every guitarist you admire was once exactly where you are.'),
  ('Muscle memory takes repetition. The more times you play something correctly, the more automatic it becomes.'),
  ('Try playing along with the actual recording of a song — it trains your ear and your feel at the same time.'),
  ('Don''t skip the boring stuff. Scales and exercises are your gym work.'),
  ('A clean note played slowly is worth more than a sloppy note played fast.'),
  ('Listen actively to music — try to pick out the guitar parts, the chord changes, the rhythm.'),
  ('If you''re frustrated, put the guitar down for 10 minutes. Come back fresh.'),
  ('Every song you learn is vocabulary. The more songs you know, the easier new ones get.'),
  ('Your pick angle, grip, and attack all affect your tone. Experiment.'),
  ('Sing along while you play — even humming. It connects your ear to your hands.'),
  ('The best practice is consistent practice. 15 minutes every day beats 2 hours once a week.'),
  ('Play something all the way through without stopping, even if you make mistakes. Stopping is a habit.'),
  ('Barre chords taking forever? That''s normal. They click for everyone eventually.'),
  ('Try learning a song in a different key — it forces you to think, not just remember.'),
  ('Your tone starts with your hands, not your gear.'),
  ('Watch other guitarists play — YouTube is a free masterclass.'),
  ('If something sounds off, trust your ear. Your ear is always right.'),
  ('Practice switching chords without looking at your hands.'),
  ('The goal isn''t to be perfect. The goal is to be better than yesterday.'),
  ('Play for someone, even if it''s just a pet. Performance is a different skill than practice.'),
  ('Learn the melody of a song, not just the chords. It''ll change how you understand music.'),
  ('Rest is part of practice. Your brain consolidates learning while you sleep.'),
  ('Don''t compare your chapter 1 to someone else''s chapter 20.'),
  ('One good habit practiced daily will take you further than ten techniques practiced occasionally.');
