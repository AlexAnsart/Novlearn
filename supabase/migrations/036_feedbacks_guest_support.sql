-- Migration 036 : Permettre les feedbacks sans connexion
-- Supprime la FK sur user_id (source du 409 si profil absent)
-- et corrige la politique RLS pour les utilisateurs non connectés

-- 1. Supprimer la contrainte FK pour éviter les violations de contrainte
ALTER TABLE public.feedbacks
DROP CONSTRAINT IF EXISTS feedbacks_user_id_fkey;

-- 2. Corriger la politique INSERT
--    - Invité (auth.uid() IS NULL) : user_id doit être NULL
--    - Connecté : user_id doit correspondre à auth.uid()
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer un feedback" ON public.feedbacks;

CREATE POLICY "Les utilisateurs peuvent créer un feedback"
  ON public.feedbacks FOR INSERT
  WITH CHECK (
    ((SELECT auth.uid()) IS NULL AND user_id IS NULL)
    OR (SELECT auth.uid()) = user_id
  );

-- 3. Corriger la politique SELECT pour que les admins voient aussi les feedbacks anonymes
DROP POLICY IF EXISTS "Lecture feedbacks" ON public.feedbacks;

CREATE POLICY "Lecture feedbacks"
  ON public.feedbacks FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'tuteur')
    )
  );
