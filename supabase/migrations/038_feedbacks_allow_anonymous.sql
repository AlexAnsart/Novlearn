-- Migration 038 : Autoriser les feedbacks des utilisateurs anonymes (mode invité)
-- Les anonymes ont un auth.uid() mais pas de profil dans profiles → la FK échouait (409)
-- Solution : user_id NULL toujours autorisé, user_id non-null doit correspondre à auth.uid()

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer un feedback" ON public.feedbacks;

CREATE POLICY "Les utilisateurs peuvent créer un feedback"
  ON public.feedbacks FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR (SELECT auth.uid()) = user_id
  );
