-- Migration 033 : Rendre la relation feedbacks->profiles optionnelle
-- Permet aux users guest (user_id NULL) et au users authentifiés

-- Supprimer l'ancienne contrainte FK vers auth.users
ALTER TABLE public.feedbacks
DROP CONSTRAINT IF EXISTS feedbacks_user_id_fkey;

-- Ajouter la nouvelle contrainte FK vers profiles (qui elle-même référence auth.users)
ALTER TABLE public.feedbacks
ADD CONSTRAINT feedbacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Mettre à jour la politique RLS pour permettre aux guests ET aux users authentifiés
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer un feedback" ON public.feedbacks;

CREATE POLICY "Les utilisateurs peuvent créer un feedback"
  ON public.feedbacks FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NULL  -- Guest
    OR (SELECT auth.uid()) = user_id  -- User authentifié
  );
