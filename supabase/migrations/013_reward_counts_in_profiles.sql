-- ============================================
-- Reward counts dénormalisés dans profiles
-- 1er → crown_count, 2ème/3ème → star_count
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crown_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS star_count  INT NOT NULL DEFAULT 0;

-- Initialiser les compteurs depuis les récompenses existantes
UPDATE public.profiles p
SET
  crown_count = COALESCE((SELECT COUNT(*) FROM public.user_weekly_rewards WHERE user_id = p.id AND rank = 1), 0),
  star_count  = COALESCE((SELECT COUNT(*) FROM public.user_weekly_rewards WHERE user_id = p.id AND rank IN (2, 3)), 0);

-- DROP requis car on change le type de retour (nouvelles colonnes)
DROP FUNCTION IF EXISTS get_weekly_leaderboard(TIMESTAMPTZ, INT, TEXT);

-- Mise à jour de get_weekly_leaderboard : retourne aussi les compteurs de récompenses
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(
  week_start TIMESTAMPTZ,
  result_limit INT DEFAULT 10,
  sort_by TEXT DEFAULT 'score'
)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  score BIGINT,
  best_streak BIGINT,
  rank BIGINT,
  crown_count INT,
  star_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT
      ea.user_id,
      p.first_name,
      p.last_name,
      COUNT(*) AS score,
      COUNT(DISTINCT DATE(ea.attempted_at)) AS best_streak,
      p.crown_count,
      p.star_count
    FROM public.exercise_attempts ea
    LEFT JOIN public.profiles p ON p.id = ea.user_id
    WHERE ea.is_correct = true
      AND ea.attempted_at >= week_start
    GROUP BY ea.user_id, p.first_name, p.last_name, p.crown_count, p.star_count
  ),
  ranked_scores AS (
    SELECT
      us.user_id,
      us.first_name,
      us.last_name,
      us.score,
      us.best_streak,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN sort_by = 'streak' THEN us.best_streak ELSE us.score END DESC
      ) AS rank,
      us.crown_count,
      us.star_count
    FROM user_scores us
  )
  SELECT
    rs.user_id,
    rs.first_name,
    rs.last_name,
    rs.score,
    rs.best_streak,
    rs.rank,
    rs.crown_count,
    rs.star_count
  FROM ranked_scores rs
  ORDER BY rs.rank
  LIMIT result_limit;
END;
$$;

-- award_weekly_top3 : 1er → crown_count, 2ème/3ème → star_count
CREATE OR REPLACE FUNCTION award_weekly_top3()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_week_start TIMESTAMPTZ;
  v_entry RECORD;
BEGIN
  v_prev_week_start := DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC' - INTERVAL '1 week');

  FOR v_entry IN (
    SELECT user_id, rank
    FROM get_weekly_leaderboard(v_prev_week_start, 3, 'score')
    WHERE rank <= 3
  ) LOOP
    INSERT INTO public.user_weekly_rewards (user_id, week_start, rank)
    VALUES (v_entry.user_id, v_prev_week_start::DATE, v_entry.rank)
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
END;
$$;

GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(TIMESTAMPTZ, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION award_weekly_top3() TO service_role;
