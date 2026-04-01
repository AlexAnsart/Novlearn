-- Migration 020 : Ajout des colonnes role, current_streak, max_streak sur profiles
-- + fonction get_my_role() utilisée pour la protection anti-escalade de rôle

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role           TEXT    NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS current_streak INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_streak     INT     NOT NULL DEFAULT 0;

-- Retourne le rôle du user connecté (utilisé dans les politiques RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
