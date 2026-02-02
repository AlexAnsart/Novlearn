-- Competence metadata (name, chapter, max_points) is now in frontend settings only.
-- Drop competences table and FKs so we don't maintain them in Supabase.
-- This migration is idempotent: safe to run even if competences table doesn't exist.

-- Drop FK from user_competence_scores if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_competence_scores') THEN
    ALTER TABLE public.user_competence_scores
      DROP CONSTRAINT IF EXISTS user_competence_scores_competence_id_fkey;
  END IF;
END $$;

-- Drop FK from exercises if constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'exercises' 
    AND constraint_name = 'exercises_competence_id_fkey'
  ) THEN
    ALTER TABLE public.exercises
      DROP CONSTRAINT exercises_competence_id_fkey;
  END IF;
END $$;

-- Drop competences table if it exists
DROP TABLE IF EXISTS public.competences;
