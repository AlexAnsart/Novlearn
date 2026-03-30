-- Migration 024 : Nouvelles fonctions + réécriture get_monthly_leaderboard
-- + trigger on_exercise_attempt_process

-- ============================================================
-- is_guest() : vérifie si le user connecté est anonyme
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_guest()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'is_anonymous')::boolean,
    false
  );
$$;

-- ============================================================
-- admin_get_profile() : profil complet, accessible aux admins seulement
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_profile(target_user_id UUID)
RETURNS TABLE (
  id           UUID,
  email        TEXT,
  first_name   TEXT,
  last_name    TEXT,
  birth_date   DATE,
  role         TEXT,
  created_at   TIMESTAMPTZ,
  consent_date TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    p.id, p.email, p.first_name, p.last_name,
    p.birth_date, p.role, p.created_at, p.consent_date
  FROM profiles p
  WHERE p.id = target_user_id
    AND EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.admin_get_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_profile(UUID) TO authenticated;

-- ============================================================
-- find_user_by_friend_code() : résout un code ami → user_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_user_by_friend_code(input_code TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT user_id FROM friend_codes
  WHERE code = input_code
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_friend_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_by_friend_code(TEXT) TO authenticated;

-- ============================================================
-- get_chapters_with_count() : chapitres + stats exercices par user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_chapters_with_count(target_user_id UUID)
RETURNS TABLE (
  chapter_name         TEXT,
  total_exercises      BIGINT,
  completed_exercises  BIGINT,
  progress_percentage  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  RETURN QUERY
  SELECT
    e.chapter AS chapter_name,
    COUNT(DISTINCT e.id) AS total_exercises,
    COUNT(DISTINCT ea.exercise_id) FILTER (
      WHERE ea.user_id = target_user_id AND ea.is_correct = true
    ) AS completed_exercises,
    CASE
      WHEN COUNT(DISTINCT e.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(DISTINCT ea.exercise_id) FILTER (
          WHERE ea.user_id = target_user_id AND ea.is_correct = true
        )::NUMERIC / COUNT(DISTINCT e.id)::NUMERIC) * 100, 1
      )
    END AS progress_percentage
  FROM public.exercises e
  LEFT JOIN public.exercise_attempts ea
    ON e.id = ea.exercise_id AND ea.user_id = target_user_id
  GROUP BY e.chapter
  ORDER BY e.chapter;
END;
$$;

REVOKE ALL ON FUNCTION public.get_chapters_with_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chapters_with_count(UUID) TO authenticated;

-- ============================================================
-- get_friends_and_requests() : liste amis + demandes reçues
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_friends_and_requests(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  friends_list  JSON;
  requests_list JSON;
BEGIN
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  SELECT json_agg(t) INTO friends_list
  FROM (
    SELECT
      p.id, p.first_name, p.last_name, p.email,
      f.id AS friendship_id
    FROM public.friends f
    JOIN public.profiles p ON (
      CASE
        WHEN f.user1_id = target_user_id THEN f.user2_id = p.id
        ELSE f.user1_id = p.id
      END
    )
    WHERE (f.user1_id = target_user_id OR f.user2_id = target_user_id)
      AND f.status = 'accepted'
  ) t;

  SELECT json_agg(t) INTO requests_list
  FROM (
    SELECT
      fr.id AS request_id,
      p.id  AS from_user_id,
      p.first_name,
      p.last_name
    FROM public.friend_requests fr
    JOIN public.profiles p ON fr.from_user_id = p.id
    WHERE fr.to_user_id = target_user_id
      AND fr.status = 'pending'
  ) t;

  RETURN json_build_object(
    'friends',  COALESCE(friends_list,  '[]'::json),
    'requests', COALESCE(requests_list, '[]'::json)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_friends_and_requests(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_friends_and_requests(UUID) TO authenticated;

-- ============================================================
-- get_random_exercise() : exercice aléatoire par chapitre/difficulté
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_random_exercise(
  p_chapter    TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  exercise_data JSON;
BEGIN
  SELECT row_to_json(e) INTO exercise_data
  FROM public.exercises e
  WHERE (p_chapter    IS NULL OR e.chapter    = p_chapter)
    AND (p_difficulty IS NULL OR e.difficulty = p_difficulty)
  ORDER BY RANDOM()
  LIMIT 1;

  RETURN exercise_data;
END;
$$;

REVOKE ALL ON FUNCTION public.get_random_exercise(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_random_exercise(TEXT, TEXT) TO authenticated;

-- ============================================================
-- get_monthly_leaderboard() : classement depuis monthly_scores
-- Signature mise à jour : retourne score INT (pas BIGINT) + best_streak INT
-- ============================================================
DROP FUNCTION IF EXISTS public.get_monthly_leaderboard(TIMESTAMPTZ, INT);

CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(
  month_start  TIMESTAMPTZ,
  result_limit INT  DEFAULT 10,
  sort_by      TEXT DEFAULT 'score'
)
RETURNS TABLE (
  user_id     UUID,
  first_name  TEXT,
  last_name   TEXT,
  score       INT,
  best_streak INT,
  rank        BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF sort_by = 'streak' THEN
    RETURN QUERY
    SELECT
      ms.user_id,
      p.first_name,
      p.last_name,
      ms.score,
      ms.max_streak AS best_streak,
      ROW_NUMBER() OVER (ORDER BY ms.max_streak DESC, ms.score DESC) AS rank
    FROM public.monthly_scores ms
    LEFT JOIN public.profiles p ON ms.user_id = p.id
    WHERE EXTRACT(MONTH FROM ms.month_date) = EXTRACT(MONTH FROM month_start)
      AND EXTRACT(YEAR  FROM ms.month_date) = EXTRACT(YEAR  FROM month_start)
    ORDER BY rank ASC
    LIMIT result_limit;
  ELSE
    RETURN QUERY
    SELECT
      ms.user_id,
      p.first_name,
      p.last_name,
      ms.score,
      ms.max_streak AS best_streak,
      ROW_NUMBER() OVER (ORDER BY ms.score DESC, ms.max_streak DESC) AS rank
    FROM public.monthly_scores ms
    LEFT JOIN public.profiles p ON ms.user_id = p.id
    WHERE EXTRACT(MONTH FROM ms.month_date) = EXTRACT(MONTH FROM month_start)
      AND EXTRACT(YEAR  FROM ms.month_date) = EXTRACT(YEAR  FROM month_start)
    ORDER BY rank ASC
    LIMIT result_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_leaderboard(TIMESTAMPTZ, INT, TEXT) TO authenticated;

-- ============================================================
-- handle_exercise_completion() : trigger AFTER INSERT exercise_attempts
-- Met à jour profiles.current_streak / max_streak + monthly_scores
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
  -- Conversion sécurisée de l'ID
  BEGIN
    safe_exercise_id := CAST(NEW.exercise_id AS BIGINT);
  EXCEPTION WHEN OTHERS THEN
    safe_exercise_id := NULL;
  END;

  -- Récupération de la difficulté
  IF safe_exercise_id IS NOT NULL THEN
    SELECT difficulty INTO difficulty_level
    FROM public.exercises WHERE id = safe_exercise_id;
  END IF;

  -- Calcul des points selon la difficulté
  CASE LOWER(TRIM(difficulty_level))
    WHEN 'medium'    THEN points_to_add := 2;
    WHEN 'moyen'     THEN points_to_add := 2;
    WHEN 'hard'      THEN points_to_add := 3;
    WHEN 'difficile' THEN points_to_add := 3;
    ELSE                  points_to_add := 1;
  END CASE;

  IF NEW.is_correct = TRUE THEN
    -- Incrémenter le streak du profil
    UPDATE public.profiles
    SET current_streak = COALESCE(current_streak, 0) + 1,
        updated_at     = NOW()
    WHERE id = NEW.user_id
    RETURNING current_streak INTO new_streak;

    -- Mettre à jour le max_streak si dépassé
    UPDATE public.profiles
    SET max_streak = GREATEST(COALESCE(max_streak, 0), new_streak),
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Upsert monthly_scores
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
    -- Mauvaise réponse : streak retombe à 0
    UPDATE public.profiles
    SET current_streak = 0,
        updated_at     = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger sur exercise_attempts
DROP TRIGGER IF EXISTS on_exercise_attempt_process ON public.exercise_attempts;
CREATE TRIGGER on_exercise_attempt_process
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_completion();
