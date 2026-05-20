-- Migration 043 : Fix de la contrainte FK exercise_attempts.exercise_id
--
-- Contexte :
-- En production, la contrainte FK porte le nom `fk_exercise` et a été créée
-- sans clause `ON DELETE` (donc NO ACTION par défaut). Conséquence : impossible
-- de supprimer un exercice dès qu'une tentative y fait référence
-- ("update or delete on table exercises violates foreign key constraint fk_exercise").
--
-- Comportement souhaité : ON DELETE SET NULL — on conserve l'historique des
-- tentatives (streaks, leaderboards, taux de réussite, statistiques) mais on
-- libère la référence vers l'exercice supprimé. Cohérent avec
-- duels.exercise_id et feedbacks.exercise_id qui utilisent déjà SET NULL.

-- 1. S'assurer que la colonne est nullable (requis pour SET NULL)
ALTER TABLE public.exercise_attempts
  ALTER COLUMN exercise_id DROP NOT NULL;

-- 2. Supprimer les variantes existantes de la contrainte (nom prod + nom par défaut)
ALTER TABLE public.exercise_attempts
  DROP CONSTRAINT IF EXISTS fk_exercise;

ALTER TABLE public.exercise_attempts
  DROP CONSTRAINT IF EXISTS exercise_attempts_exercise_id_fkey;

-- 3. Recréer la contrainte avec ON DELETE SET NULL
ALTER TABLE public.exercise_attempts
  ADD CONSTRAINT exercise_attempts_exercise_id_fkey
    FOREIGN KEY (exercise_id)
    REFERENCES public.exercises(id)
    ON DELETE SET NULL;
