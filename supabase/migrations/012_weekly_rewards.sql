-- ============================================
-- Weekly Rewards System
-- Stocke les récompenses pour le top 3 hebdomadaire
-- 1er → couronne, 2ème/3ème → étoile
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_weekly_rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL, -- Lundi de la semaine récompensée
  rank INT NOT NULL CHECK (rank BETWEEN 1 AND 3),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.user_weekly_rewards ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut lire ses propres récompenses
CREATE POLICY "Users can view their own rewards"
  ON public.user_weekly_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Fonction appelée chaque lundi à 00:01 UTC pour récompenser le top 3 de la semaine précédente
CREATE OR REPLACE FUNCTION award_weekly_top3()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_week_start TIMESTAMPTZ;
  v_entry RECORD;
BEGIN
  -- Lundi 00:00 UTC de la semaine PRÉCÉDENTE
  v_prev_week_start := DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC' - INTERVAL '1 week');

  FOR v_entry IN (
    SELECT user_id, rank
    FROM get_weekly_leaderboard(v_prev_week_start, 3, 'score')
    WHERE rank <= 3
  ) LOOP
    INSERT INTO public.user_weekly_rewards (user_id, week_start, rank)
    VALUES (v_entry.user_id, v_prev_week_start::DATE, v_entry.rank)
    ON CONFLICT (user_id, week_start) DO UPDATE
      SET rank = EXCLUDED.rank,
          awarded_at = NOW();
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION award_weekly_top3() TO service_role;
-- La planification se fait via GitHub Actions (voir .github/workflows/weekly-rewards.yml)
