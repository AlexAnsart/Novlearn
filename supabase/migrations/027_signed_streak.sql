-- Migration 027: current_streak signé dans profiles
-- Bonne réponse : si <0 repart à 1, sinon +1
-- Mauvaise réponse : si >0 repart à -1, sinon -1
-- max_streak uniquement mis à jour sur les streaks positifs
-- Pas de changement DDL : INT accepte déjà les négatifs, aucune contrainte CHECK

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
    -- Bonne réponse : si on était en série négative, repartir à 1 ; sinon incrémenter
    UPDATE public.profiles
    SET current_streak = CASE
                           WHEN COALESCE(current_streak, 0) < 0 THEN 1
                           ELSE COALESCE(current_streak, 0) + 1
                         END,
        updated_at = NOW()
    WHERE id = NEW.user_id
    RETURNING current_streak INTO new_streak;

    -- max_streak uniquement quand la série positive bat le record
    UPDATE public.profiles
    SET max_streak = GREATEST(COALESCE(max_streak, 0), new_streak),
        updated_at = NOW()
    WHERE id = NEW.user_id;

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
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;
