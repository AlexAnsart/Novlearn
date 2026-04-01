-- Migration 026: Add hidden_chapters column to profiles
-- Allows users to mark chapters they haven't studied yet.
-- The array stores chapter names (TEXT) matching the chapters.name field.
-- Empty array (default) = all chapters are visible / available for recommendations.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hidden_chapters TEXT[] NOT NULL DEFAULT '{}';
