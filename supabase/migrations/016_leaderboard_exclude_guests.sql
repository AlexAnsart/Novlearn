-- Exclure les tentatives invité du classement hebdomadaire
DROP FUNCTION IF EXISTS get_weekly_leaderboard(TIMESTAMPTZ, INT, TEXT);

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
      AND ea.is_guest = false  -- exclure les tentatives des invités
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

GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(TIMESTAMPTZ, INT, TEXT) TO authenticated;
