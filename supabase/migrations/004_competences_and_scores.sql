-- ============================================
-- Competences + user competence scores (score only increments, never decrements)
-- ============================================

-- Table: competences (one per skill, belongs to a chapter)
CREATE TABLE IF NOT EXISTS public.competences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  chapter TEXT NOT NULL,
  max_points INT NOT NULL CHECK (max_points > 0)
);

-- Table: user_competence_scores (current points and streak per user per competence)
CREATE TABLE IF NOT EXISTS public.user_competence_scores (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  competence_id TEXT REFERENCES public.competences(id) ON DELETE CASCADE NOT NULL,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  streak INT NOT NULL DEFAULT 0 CHECK (streak >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, competence_id)
);

-- Add competence_id to exercises (nullable: existing exercises may have no competence)
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS competence_id TEXT REFERENCES public.competences(id) ON DELETE SET NULL;

-- Index for listing scores by user
CREATE INDEX IF NOT EXISTS idx_user_competence_scores_user_id ON public.user_competence_scores(user_id);

-- RLS
ALTER TABLE public.competences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_competence_scores ENABLE ROW LEVEL SECURITY;

-- Everyone (authenticated) can read competences
CREATE POLICY "Authenticated can read competences"
  ON public.competences FOR SELECT
  TO authenticated
  USING (true);

-- Users can read/insert/update own scores only
CREATE POLICY "Users can read own competence scores"
  ON public.user_competence_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competence scores"
  ON public.user_competence_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competence scores"
  ON public.user_competence_scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed example competences (Suites et limites)
INSERT INTO public.competences (id, name, chapter, max_points) VALUES
  ('limites_de_suites_usuelles', 'Limites de suites usuelles', 'Suites et limites', 10),
  ('somme_des_termes_d_une_suite', 'Somme des termes d''une suite', 'Suites et limites', 20),
  ('suites_croissantes_decroissantes', 'Suites croissantes / décroissantes', 'Suites et limites', 15)
ON CONFLICT (id) DO NOTHING;
