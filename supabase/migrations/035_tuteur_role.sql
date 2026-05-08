-- Migration 035 : Ajout du rôle tuteur
-- Le rôle tuteur a accès à la lecture des feedbacks pour le dashboard

-- On met à jour la politique de lecture des feedbacks
DROP POLICY IF EXISTS "Lecture feedbacks" ON public.feedbacks;

CREATE POLICY "Lecture feedbacks"
  ON public.feedbacks FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND (role = 'admin' OR role = 'tuteur')
    )
  );
