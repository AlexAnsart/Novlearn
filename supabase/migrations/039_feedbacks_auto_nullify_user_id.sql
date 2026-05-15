-- Migration 039 : Trigger BEFORE INSERT qui met user_id=NULL si le profil n'existe pas
-- Couvre les utilisateurs anonymes (is_anonymous=true) qui ont un auth.uid() valide
-- mais pas d'entrée dans profiles → évite la violation de FK (409)

CREATE OR REPLACE FUNCTION public.feedbacks_nullify_missing_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.user_id
  ) THEN
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER feedbacks_check_user_id
  BEFORE INSERT ON public.feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.feedbacks_nullify_missing_profile();
