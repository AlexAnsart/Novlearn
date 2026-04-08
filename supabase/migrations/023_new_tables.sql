-- Migration 023 : Nouvelles tables absentes des migrations précédentes
-- feedbacks, flashcards, monthly_scores

-- ============================================================
-- TABLE feedbacks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  user_id          UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  exercise_id      BIGINT      REFERENCES public.exercises(id) ON DELETE SET NULL,
  category         TEXT        NOT NULL,
  message          TEXT        NOT NULL,
  status           TEXT        DEFAULT 'pending',
  difficulty_rating BIGINT
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Un utilisateur voit ses propres feedbacks ; un admin voit tout
CREATE POLICY "Lecture feedbacks"
  ON public.feedbacks FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Les utilisateurs peuvent créer un feedback"
  ON public.feedbacks FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Les admins peuvent supprimer"
  ON public.feedbacks FOR DELETE
  USING (
    (SELECT profiles.role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================
-- TABLE flashcards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter    TEXT        NOT NULL,
  question   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Lecture publique (non authentifiée aussi)
CREATE POLICY "Flashcards lecture publique"
  ON public.flashcards FOR SELECT
  USING (true);

-- Écriture réservée aux admins
CREATE POLICY "Flashcards admin write"
  ON public.flashcards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================
-- TABLE monthly_scores
-- Scores dénormalisés par utilisateur et par mois.
-- Mis à jour via le trigger on_exercise_attempt_process (migration 024).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_scores (
  user_id          UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_date       DATE  NOT NULL,
  score            INT   DEFAULT 0,
  exercises_count  INT   DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT now(),
  max_streak       INT   DEFAULT 0,
  PRIMARY KEY (user_id, month_date)
);

ALTER TABLE public.monthly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique du classement"
  ON public.monthly_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_monthly_scores_date_score
  ON public.monthly_scores (month_date, score DESC);
