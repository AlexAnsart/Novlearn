-- ============================================
-- SCHÉMA NOVLEARN MVP - Conforme RGPD
-- ============================================

-- Table: profiles (données utilisateur)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  birth_date DATE NOT NULL, -- Pour vérification âge
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- RGPD: date de consentement
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Vérification que l'utilisateur a >= 15 ans
  CONSTRAINT check_age CHECK (
    EXTRACT(YEAR FROM AGE(birth_date)) >= 15
  )
);

-- Table: user_progress (progression par chapitre)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter TEXT NOT NULL, -- 'sequences_functions', 'probabilities', 'geometry_3d'
  level INT DEFAULT 0 CHECK (level >= 0 AND level <= 100),
  exercises_completed INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, chapter)
);

-- Table: exercises (contenu exercices)
CREATE TABLE IF NOT EXISTS public.exercises (
  id BIGSERIAL PRIMARY KEY,
  chapter TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  content JSONB NOT NULL, -- Format JSON de l'exercice
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: exercise_attempts (tentatives d'exercices)
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id BIGINT REFERENCES exercises(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  time_spent INT, -- en secondes
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: duels (système 1v1)
CREATE TABLE IF NOT EXISTS public.duels (
  id BIGSERIAL PRIMARY KEY,
  player1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS) - CRITIQUE !
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES RLS - Sécurité par utilisateur
-- ============================================

-- Profiles: chaque user ne voit que son profil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Progress: chaque user ne voit que sa progression
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Exercises: tout le monde peut lire (authentifié)
CREATE POLICY "Authenticated users can view exercises"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

-- Exercise Attempts: chaque user ne voit que ses tentatives
CREATE POLICY "Users can view own attempts"
  ON public.exercise_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.exercise_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Duels: users voient leurs duels
CREATE POLICY "Users can view their duels"
  ON public.duels FOR SELECT
  USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

CREATE POLICY "Users can create duels"
  ON public.duels FOR INSERT
  WITH CHECK (auth.uid() = player1_id);

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON public.exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_duels_players ON public.duels(player1_id, player2_id);

-- ============================================
-- FUNCTION: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- FUNCTION: Créer profil automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, birth_date)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'birth_date')::DATE, '2000-01-01'::DATE)
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer profil à l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

