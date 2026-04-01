-- Migration 021 : Colonnes supplémentaires sur exercises et exercise_attempts

-- Colonnes ajoutées sur exercises
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS title            TEXT,
  ADD COLUMN IF NOT EXISTS competences      TEXT[],
  ADD COLUMN IF NOT EXISTS app_title        TEXT,
  ADD COLUMN IF NOT EXISTS "Is_Flash"       BOOLEAN,
  ADD COLUMN IF NOT EXISTS "Need_Calculator" BOOLEAN;

-- Score (points) par tentative d'exercice
ALTER TABLE public.exercise_attempts
  ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
