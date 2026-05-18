-- ============================================================
-- 040_success_rate_leaderboard.sql
--
-- 1. Table leaderboard_snapshots  — historique scalable des classements
-- 2. get_success_rate_leaderboard — classement all-time taux de réussite
-- 3. award_weekly_top3 (MAJ)     — sauvegarde automatique des snapshots
-- ============================================================


-- ─── 1. TABLE leaderboard_snapshots ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id               BIGSERIAL    PRIMARY KEY,

  -- Type de période : hebdomadaire ou all-time
  period_type      TEXT         NOT NULL CHECK (period_type IN ('weekly', 'all_time')),

  -- Métrique classée : exercices réussis, série, ou taux de réussite
  snapshot_type    TEXT         NOT NULL CHECK (snapshot_type IN ('score', 'streak', 'success_rate')),

  -- Lundi 00:00 UTC de la semaine pour 'weekly', NULL pour 'all_time'
  period_start     DATE,

  -- Données utilisateur (dénormalisées pour requêtes historiques rapides)
  user_id          UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name       TEXT,
  last_name        TEXT,

  -- Classement et métriques
  rank             INT          NOT NULL CHECK (rank > 0),
  score            BIGINT       NOT NULL DEFAULT 0,   -- pts ou streak selon snapshot_type
  total_attempts   BIGINT,
  correct_attempts BIGINT,
  success_rate     NUMERIC(5,2),                      -- 0.00..100.00 (NULL si non applicable)

  snapped_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (period_type, snapshot_type, period_start, user_id)
);

-- Index pour requêtes historiques par période
CREATE INDEX IF NOT EXISTS idx_lb_snapshots_period
  ON public.leaderboard_snapshots (period_type, snapshot_type, period_start DESC NULLS LAST);

-- Index pour le profil utilisateur (historique personnel)
CREATE INDEX IF NOT EXISTS idx_lb_snapshots_user
  ON public.leaderboard_snapshots (user_id, period_type, snapshot_type);

-- RLS : lecture par tous les authentifiés, écriture service_role uniquement
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lb_snapshots_select"
  ON public.leaderboard_snapshots
  FOR SELECT TO authenticated USING (true);


-- ─── 2. get_success_rate_leaderboard ────────────────────────────────────────
--
-- Classement all-time par taux de réussite (correct / total × 100).
-- Seuls les utilisateurs ayant réalisé au moins `min_attempts` exercices
-- (non-invité) sont éligibles.
-- Tri secondaire : total_attempts DESC pour départager les ex-æquos.

DROP FUNCTION IF EXISTS get_success_rate_leaderboard(INT, INT);

CREATE OR REPLACE FUNCTION get_success_rate_leaderboard(
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

GRANT EXECUTE ON FUNCTION get_success_rate_leaderboard(INT, INT) TO authenticated;


-- ─── 3. award_weekly_top3 (MAJ) ─────────────────────────────────────────────
--
-- Conserve la logique existante d'attribution couronnes/étoiles.
-- Ajoute la sauvegarde du snapshot hebdomadaire complet (score + streak).

CREATE OR REPLACE FUNCTION award_weekly_top3()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_week_start      TIMESTAMPTZ;
  v_prev_week_start_date DATE;
  v_entry                RECORD;
BEGIN
  v_prev_week_start      := DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC' - INTERVAL '1 week');
  v_prev_week_start_date := v_prev_week_start::DATE;

  -- Attribution couronnes/étoiles (logique inchangée)
  FOR v_entry IN (
    SELECT user_id, rank
    FROM get_weekly_leaderboard(v_prev_week_start, 3, 'score')
    WHERE rank <= 3
  ) LOOP
    INSERT INTO public.user_weekly_rewards (user_id, week_start, rank)
    VALUES (v_entry.user_id, v_prev_week_start_date, v_entry.rank)
    ON CONFLICT (user_id, week_start) DO NOTHING;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF v_entry.rank = 1 THEN
      UPDATE public.profiles SET crown_count = crown_count + 1 WHERE id = v_entry.user_id;
    ELSE
      UPDATE public.profiles SET star_count = star_count + 1 WHERE id = v_entry.user_id;
    END IF;
  END LOOP;

  -- Snapshot score (top 50 de la semaine écoulée)
  INSERT INTO public.leaderboard_snapshots
    (period_type, snapshot_type, period_start, user_id, rank, score, first_name, last_name)
  SELECT
    'weekly',
    'score',
    v_prev_week_start_date,
    user_id,
    rank::INT,
    score,
    first_name,
    last_name
  FROM get_weekly_leaderboard(v_prev_week_start, 50, 'score')
  ON CONFLICT (period_type, snapshot_type, period_start, user_id) DO NOTHING;

  -- Snapshot streak (top 50 de la semaine écoulée)
  INSERT INTO public.leaderboard_snapshots
    (period_type, snapshot_type, period_start, user_id, rank, score, first_name, last_name)
  SELECT
    'weekly',
    'streak',
    v_prev_week_start_date,
    user_id,
    rank::INT,
    best_streak,
    first_name,
    last_name
  FROM get_weekly_leaderboard(v_prev_week_start, 50, 'streak')
  ON CONFLICT (period_type, snapshot_type, period_start, user_id) DO NOTHING;

END;
$$;

GRANT EXECUTE ON FUNCTION award_weekly_top3() TO service_role;
