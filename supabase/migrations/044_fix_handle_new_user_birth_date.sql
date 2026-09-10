-- Migration 044 : Correction de handle_new_user()
--
-- La version posée par 015_guest_mode.sql insérait
--   COALESCE(NEW.raw_user_meta_data->>'birth_date', '2000-01-01')
-- c'est-à-dire du TEXT, dans profiles.birth_date qui est de type DATE.
-- Postgres refuse la conversion implicite (SQLSTATE 42804 :
-- « column "birth_date" is of type date but expression is of type text »),
-- le trigger échouait donc à CHAQUE création de compte et l'API Auth
-- répondait 500 « Database error saving new user » — inscription email
-- comme première connexion Google.
--
-- On ajoute le cast explicite, on rend la date tolérante à une valeur absente
-- ou invalide, et on récupère le prénom/nom fournis par Google
-- (given_name / family_name / full_name), absents du champ first_name.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_birth_date DATE;
BEGIN
  -- Pas de profil pour les utilisateurs anonymes (mode invité)
  IF NEW.is_anonymous = true THEN
    RETURN NEW;
  END IF;

  -- La date de naissance peut être absente (OAuth) ou mal formée :
  -- on ne fait jamais échouer la création du compte pour autant.
  BEGIN
    v_birth_date := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
      DATE '2000-01-01'
    );
  EXCEPTION WHEN others THEN
    v_birth_date := DATE '2000-01-01';
  END;

  INSERT INTO public.profiles (id, email, first_name, last_name, birth_date, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'given_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      ''
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'family_name', '')
    ),
    v_birth_date,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
