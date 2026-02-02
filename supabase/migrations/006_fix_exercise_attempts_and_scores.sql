-- Fix: ensure exercise_attempts has required columns (schema may have been created without them)
ALTER TABLE public.exercise_attempts
  ADD COLUMN IF NOT EXISTS is_correct BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.exercise_attempts
  ADD COLUMN IF NOT EXISTS time_spent INT;

ALTER TABLE public.exercise_attempts
  ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ DEFAULT NOW();

-- Add competence_id to exercises if not exists (nullable, no FK to competences table)
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS competence_id TEXT;

-- Ensure user_competence_scores exists (competence_id as plain TEXT, no competences table)
CREATE TABLE IF NOT EXISTS public.user_competence_scores (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  competence_id TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  streak INT NOT NULL DEFAULT 0 CHECK (streak >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, competence_id)
);

ALTER TABLE public.user_competence_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own competence scores" ON public.user_competence_scores;
CREATE POLICY "Users can read own competence scores"
  ON public.user_competence_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own competence scores" ON public.user_competence_scores;
CREATE POLICY "Users can insert own competence scores"
  ON public.user_competence_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own competence scores" ON public.user_competence_scores;
CREATE POLICY "Users can update own competence scores"
  ON public.user_competence_scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_competence_scores_user_id ON public.user_competence_scores(user_id);
