-- ============================================================
-- 041_weekly_success_rate_and_user_stats.sql
--
-- 1. get_success_rate_leaderboard — filtrée sur la semaine en cours
-- 2. user_stats                   — compteurs cumulatifs par utilisateur
--                                   (pour des classements all-time futurs)
-- ============================================================


-- ─── 1. get_success_rate_leaderboard (hebdomadaire) ─────────────────────────
--
-- Même fenêtre temporelle que get_weekly_leaderboard.
-- Paramètres :
--   week_start   : lundi 00:00 UTC de la semaine en cours
--   min_attempts : nombre minimum de tentatives dans la semaine (défaut 10)
--   result_limit : nombre max d'entrées retournées (défaut 20)

DROP FUNCTION IF EXISTS get_success_rate_leaderboard(INT, INT);

CREATE OR REPLACE FUNCTION get_success_rate_leaderboard(
  week_start    TIMESTAMPTZ,
  min_attempts  INT DEFAULT 10,
  result_limit  INT DEFAULT 20
)
RETURNS TABLE (
  user_id          UUID,
  first_name       TEXT,
  last_name        TEXT,
  success_rate     NUMERIC,
  total_attempts   BIGINT,
  correct_attempts BIGINT,
  rank             BIGINT,
  crown_count      INT,
  star_count       INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      ea.user_id,
      p.first_name,
      p.last_name,
      COUNT(*)                                          AS total_attempts,
      COUNT(*) FILTER (WHERE ea.is_correct = true)     AS correct_attempts,
      ROUND(
        COUNT(*) FILTER (WHERE ea.is_correct = true)::NUMERIC
        / NULLIF(COUNT(*), 0)::NUMERIC * 100,
        2
      )                                                 AS success_rate,
      p.crown_count,
      p.star_count
    FROM public.exercise_attempts ea
    JOIN public.profiles p ON p.id = ea.user_id
    WHERE ea.is_guest = false
      AND ea.attempted_at >= week_start
    GROUP BY ea.user_id, p.first_name, p.last_name, p.crown_count, p.star_count
    HAVING COUNT(*) >= min_attempts
  )
  SELECT
    us.user_id,
    us.first_name,
    us.last_name,
    us.success_rate,
    us.total_attempts,
    us.correct_attempts,
    ROW_NUMBER() OVER (
      ORDER BY us.success_rate DESC, us.total_attempts DESC
    ) AS rank,
    us.crown_count,
    us.star_count
  FROM user_stats us
  ORDER BY us.success_rate DESC, us.total_attempts DESC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_success_rate_leaderboard(TIMESTAMPTZ, INT, INT) TO authenticated;


-- ─── 2. TABLE user_stats ────────────────────────────────────────────────────
--
-- Compteurs cumulatifs all-time par utilisateur.
-- Mis à jour automatiquement via trigger sur exercise_attempts.
-- Objectif : permettre des classements all-time sans scanner toute la table
-- exercise_attempts (qui peut devenir très volumineuse).

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id          UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_attempts   BIGINT      NOT NULL DEFAULT 0,
  correct_attempts BIGINT      NOT NULL DEFAULT 0,
  total_score      BIGINT      NOT NULL DEFAULT 0,  -- somme des scores (colonne score d'exercise_attempts)
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS : chaque utilisateur lit ses propres stats ; service_role écrit
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_stats_select_own"
  ON public.user_stats FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_stats_select_leaderboard"
  ON public.user_stats FOR SELECT TO authenticated
  USING (true);

-- Index pour les classements all-time futurs
CREATE INDEX IF NOT EXISTS idx_user_stats_correct
  ON public.user_stats (correct_attempts DESC);

CREATE INDEX IF NOT EXISTS idx_user_stats_score
  ON public.user_stats (total_score DESC);


-- ─── Trigger : mise à jour de user_stats à chaque tentative ─────────────────

CREATE OR REPLACE FUNCTION update_user_stats_on_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ignorer les tentatives invité (pas de profil associé)
  IF NEW.is_guest = true OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_stats (user_id, total_attempts, correct_attempts, total_score, updated_at)
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    COALESCE(NEW.score, 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_attempts   = public.user_stats.total_attempts   + 1,
    correct_attempts = public.user_stats.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    total_score      = public.user_stats.total_score      + COALESCE(NEW.score, 0),
    updated_at       = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_user_stats ON public.exercise_attempts;

CREATE TRIGGER trg_update_user_stats
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_attempt();


-- ─── Backfill : initialiser user_stats depuis l'historique existant ──────────

INSERT INTO public.user_stats (user_id, total_attempts, correct_attempts, total_score, updated_at)
SELECT
  ea.user_id,
  COUNT(*)                                      AS total_attempts,
  COUNT(*) FILTER (WHERE ea.is_correct = true)  AS correct_attempts,
  COALESCE(SUM(ea.score), 0)                    AS total_score,
  NOW()
FROM public.exercise_attempts ea
WHERE ea.is_guest = false
  AND ea.user_id IS NOT NULL
GROUP BY ea.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_attempts   = EXCLUDED.total_attempts,
  correct_attempts = EXCLUDED.correct_attempts,
  total_score      = EXCLUDED.total_score,
  updated_at       = NOW();
