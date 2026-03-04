-- ============================================
-- Weekly Leaderboard Function
-- Remplace le classement mensuel par un classement hebdomadaire
-- ============================================

-- Suppression de l'ancienne fonction mensuelle
DROP FUNCTION IF EXISTS get_monthly_leaderboard(TIMESTAMPTZ, INT);

-- Fonction de classement hebdomadaire
-- La semaine va du lundi 00:00 UTC au dimanche 23:59:59 UTC.
-- Le frontend passe week_start = lundi 00:00 UTC de la semaine en cours.
-- Paramètres :
--   week_start    : début de la semaine (lundi 00:00 UTC)
--   result_limit  : nombre d'entrées à retourner (défaut 10)
--   sort_by       : 'score' (exercices réussis) ou 'streak' (jours actifs dans la semaine)
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
  rank BIGINT
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
      -- best_streak = nombre de jours distincts avec au moins une bonne réponse (max 7)
      COUNT(DISTINCT DATE(ea.attempted_at)) AS best_streak
    FROM public.exercise_attempts ea
    LEFT JOIN public.profiles p ON p.id = ea.user_id
    WHERE ea.is_correct = true
      AND ea.attempted_at >= week_start
    GROUP BY ea.user_id, p.first_name, p.last_name
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
      ) AS rank
    FROM user_scores us
  )
  SELECT 
    rs.user_id,
    rs.first_name,
    rs.last_name,
    rs.score,
    rs.best_streak,
    rs.rank
  FROM ranked_scores rs
  ORDER BY rs.rank
  LIMIT result_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(TIMESTAMPTZ, INT, TEXT) TO authenticated;
