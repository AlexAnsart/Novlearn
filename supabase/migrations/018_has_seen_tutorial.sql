-- Ajout de la colonne has_seen_tutorial sur profiles
-- Permet de ne déclencher le tutoriel interactif qu'une seule fois par compte,
-- même si l'utilisateur le décline (STATUS.SKIPPED dans Joyride).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_tutorial BOOLEAN NOT NULL DEFAULT false;
