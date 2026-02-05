-- ============================================
-- Monthly Leaderboard Function
-- ============================================

-- Function to get the monthly leaderboard
-- Returns users ranked by number of correct exercise attempts in the current month
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(
  month_start TIMESTAMPTZ,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  score BIGINT,
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
      COUNT(*) AS score
    FROM public.exercise_attempts ea
    LEFT JOIN public.profiles p ON p.id = ea.user_id
    WHERE ea.is_correct = true
      AND ea.attempted_at >= month_start
    GROUP BY ea.user_id, p.first_name, p.last_name
  ),
  ranked_scores AS (
    SELECT 
      us.user_id,
      us.first_name,
      us.last_name,
      us.score,
      ROW_NUMBER() OVER (ORDER BY us.score DESC) AS rank
    FROM user_scores us
  )
  SELECT 
    rs.user_id,
    rs.first_name,
    rs.last_name,
    rs.score,
    rs.rank
  FROM ranked_scores rs
  ORDER BY rs.rank
  LIMIT result_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard(TIMESTAMPTZ, INT) TO authenticated;

-- Policy to allow reading profiles for leaderboard display (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated can read profiles for leaderboard'
  ) THEN
    CREATE POLICY "Authenticated can read profiles for leaderboard"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
