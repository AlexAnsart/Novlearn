-- Migration 037 : Restaure la FK feedbacks->profiles
-- Nécessaire pour que PostgREST puisse faire le JOIN profiles(first_name, last_name)
-- La migration 036 avait supprimé la FK, cassant la requête SELECT de la page admin
--
-- Certains feedbacks avaient un user_id référençant auth.users mais sans profil correspondant
-- (cause originale du 409). On les passe à NULL avant d'ajouter la contrainte.

UPDATE public.feedbacks
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.feedbacks
ADD CONSTRAINT feedbacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
