-- Migration 032 : Corriger la contrainte de clé étrangère sur feedbacks
-- Permet aux utilisateurs anonymes (guests) d'envoyer des feedbacks
-- en référençant auth.users.id au lieu de profiles.id

-- 1. Supprimer l'ancienne contrainte FK
ALTER TABLE public.feedbacks
DROP CONSTRAINT IF EXISTS feedbacks_user_id_fkey;

-- 2. Ajouter la nouvelle contrainte FK vers auth.users
ALTER TABLE public.feedbacks
ADD CONSTRAINT feedbacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Ajouter une politique RLS pour permettre aux guests de créer des feedbacks
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer un feedback" ON public.feedbacks;

CREATE POLICY "Les utilisateurs peuvent créer un feedback"
  ON public.feedbacks FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IS NOT NULL);
