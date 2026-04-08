-- Add avatar customization columns to profiles
ALTER TABLE profiles
  ADD COLUMN avatar_id    TEXT NOT NULL DEFAULT 'fox',
  ADD COLUMN avatar_color TEXT NOT NULL DEFAULT '#6366f1';
