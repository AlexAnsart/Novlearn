-- Migration 037 : Restaure la FK feedbacks->profiles
-- Nécessaire pour que PostgREST puisse faire le JOIN profiles(first_name, last_name)
-- La migration 036 avait supprimé la FK, cassant la requête SELECT de la page admin

ALTER TABLE public.feedbacks
ADD CONSTRAINT feedbacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
