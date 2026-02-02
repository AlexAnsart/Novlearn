-- Competence metadata (name, chapter, max_points) is now in frontend settings only.
-- Drop competences table and FKs so we don't maintain them in Supabase.

ALTER TABLE public.user_competence_scores
  DROP CONSTRAINT IF EXISTS user_competence_scores_competence_id_fkey;

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_competence_id_fkey;

DROP TABLE IF EXISTS public.competences;
