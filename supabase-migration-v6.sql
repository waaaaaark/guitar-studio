-- ============================================
-- Guitar Studio - Migration v6
-- Run in Supabase SQL editor
-- ============================================

-- Add email template fields to app_settings
alter table app_settings
  add column if not exists lesson_email_intro text default 'Here''s a summary of what we worked on today.',
  add column if not exists lesson_email_closing text default 'Keep practicing and I''ll see you next time!',
  add column if not exists onboarding_email_intro text default 'I''ve set up a page for you to track our lesson notes, songs, and resources.',
  add column if not exists onboarding_email_closing text default 'Bookmark this link — it''s yours and doesn''t require any login. See you at our next lesson!';
