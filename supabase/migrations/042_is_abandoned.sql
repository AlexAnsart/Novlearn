-- ============================================================
-- 042_is_abandoned.sql
--
-- Ajoute is_abandoned à exercise_attempts.
-- true  = l'utilisateur a quitté avant de terminer l'exercice.
-- false = l'exercice a été complété (correctement ou non).
--
-- Permet de distinguer "a abandonné" de "a répondu faux" dans
-- les futures analyses, sans impacter la logique de score.
-- ============================================================

ALTER TABLE public.exercise_attempts
  ADD COLUMN IF NOT EXISTS is_abandoned BOOLEAN NOT NULL DEFAULT FALSE;

-- Index utile pour filtrer les tentatives réellement complétées
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_abandoned
  ON public.exercise_attempts (user_id, is_abandoned)
  WHERE is_abandoned = false;
