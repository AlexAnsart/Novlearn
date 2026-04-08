-- Migration 030: Fix max_streak – trigger atomique + backfill historique
-- Problème: le trigger utilisait deux UPDATE séparés ; le second pouvait
-- silencieusement ne pas s'exécuter, laissant max_streak à 0.
-- Solution: fusionner les deux UPDATE en un seul SET atomique.

-- ============================================================
-- 1. Corriger le trigger handle_exercise_completion
--    On calcule current_streak ET max_streak dans un seul UPDATE.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_exercise_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points_to_add    INT;
  difficulty_level TEXT;
  new_streak       INT;
  safe_exercise_id BIGINT;
BEGIN
  BEGIN
    safe_exercise_id := CAST(NEW.exercise_id AS BIGINT);
  EXCEPTION WHEN OTHERS THEN
    safe_exercise_id := NULL;
  END;

  IF safe_exercise_id IS NOT NULL THEN
    SELECT difficulty INTO difficulty_level
    FROM public.exercises WHERE id = safe_exercise_id;
  END IF;

  CASE LOWER(TRIM(difficulty_level))
    WHEN 'medium'    THEN points_to_add := 2;
    WHEN 'moyen'     THEN points_to_add := 2;
    WHEN 'hard'      THEN points_to_add := 3;
    WHEN 'difficile' THEN points_to_add := 3;
    ELSE                  points_to_add := 1;
  END CASE;

  IF NEW.is_correct = TRUE THEN
    -- Bonne réponse : un seul UPDATE atomique pour current_streak ET max_streak.
    -- Les deux SET sont évalués sur les valeurs AVANT la mise à jour (comportement
    -- standard PostgreSQL), donc new_current_streak est calculé deux fois de façon
    -- cohérente.
    UPDATE public.profiles
    SET current_streak = CASE
                           WHEN COALESCE(current_streak, 0) < 0 THEN 1
                           ELSE COALESCE(current_streak, 0) + 1
                         END,
        max_streak     = GREATEST(
                           COALESCE(max_streak, 0),
                           CASE
                             WHEN COALESCE(current_streak, 0) < 0 THEN 1
                             ELSE COALESCE(current_streak, 0) + 1
                           END
                         ),
        updated_at     = NOW()
    WHERE id = NEW.user_id
    RETURNING current_streak INTO new_streak;

    INSERT INTO public.monthly_scores (user_id, month_date, score, exercises_count, max_streak)
    VALUES (
      NEW.user_id,
      DATE_TRUNC('month', NEW.attempted_at)::DATE,
      points_to_add,
      1,
      new_streak
    )
    ON CONFLICT (user_id, month_date) DO UPDATE SET
      score           = monthly_scores.score + EXCLUDED.score,
      exercises_count = monthly_scores.exercises_count + 1,
      max_streak      = GREATEST(monthly_scores.max_streak, EXCLUDED.max_streak),
      updated_at      = NOW();

  ELSE
    -- Mauvaise réponse : si on était en série positive, repartir à -1 ; sinon décrémenter
    UPDATE public.profiles
    SET current_streak = CASE
                           WHEN COALESCE(current_streak, 0) > 0 THEN -1
                           ELSE COALESCE(current_streak, 0) - 1
                         END,
        updated_at     = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Backfill max_streak depuis l'historique réel des tentatives
--    On recalcule la vraie meilleure série consécutive correcte
--    pour chaque utilisateur non-invité.
-- ============================================================
WITH attempts_ordered AS (
  SELECT
    user_id,
    is_correct,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY attempted_at) AS rn
  FROM public.exercise_attempts
  WHERE is_guest = FALSE
),
streak_groups AS (
  SELECT
    user_id,
    is_correct,
    rn - ROW_NUMBER() OVER (PARTITION BY user_id, is_correct ORDER BY rn) AS grp
  FROM attempts_ordered
),
streaks AS (
  SELECT user_id, COUNT(*) AS streak_len
  FROM streak_groups
  WHERE is_correct = TRUE
  GROUP BY user_id, grp
),
historical_max AS (
  SELECT user_id, MAX(streak_len)::INT AS best_streak
  FROM streaks
  GROUP BY user_id
)
UPDATE public.profiles p
SET max_streak = GREATEST(COALESCE(p.max_streak, 0), hm.best_streak),
    updated_at = NOW()
FROM historical_max hm
WHERE p.id = hm.user_id;
