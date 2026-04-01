-- 1. Activer les sessions anonymes (à faire aussi dans le dashboard Supabase :
--    Authentication > Sign In Methods > Allow anonymous sign-ins = ON)

-- 2. Colonne is_guest sur exercise_attempts pour tracker les tentatives invité
ALTER TABLE exercise_attempts
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;

-- 3. Index pour compter rapidement les tentatives d'un invité
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_guest
  ON exercise_attempts(user_id, is_guest)
  WHERE is_guest = true;

-- 4. La table profiles ne doit PAS être créée pour les invités
--    On modifie le trigger pour ignorer les users anonymes :
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Ne pas créer de profil pour les utilisateurs anonymes
  IF NEW.is_anonymous = true THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, birth_date, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'birth_date', '2000-01-01'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS : les utilisateurs anonymes peuvent lire les exercices (déjà OK si public)
--    et insérer leurs propres tentatives.
--    La policy existante "users can insert own attempts" couvre déjà les anonymes
--    car auth.uid() = user_id fonctionne pour les sessions anonymes aussi.

-- 6. Sécurité : les policies existantes basées sur auth.uid() suffisent car
--    les invités n'ont pas de profil dans la table profiles.
