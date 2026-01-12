-- ============================================
-- MIGRATION 002: Système d'Amis et Duels Complet
-- ============================================

-- Table: friend_codes (codes pour invitations)
CREATE TABLE IF NOT EXISTS public.friend_codes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: friends (relations d'amitié)
CREATE TABLE IF NOT EXISTS public.friends (
  id BIGSERIAL PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Évite les doublons (user1 toujours < user2)
);

-- Table: friend_requests (demandes d'amis)
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Étendre la table duels avec les colonnes manquantes
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS exercise_id BIGINT REFERENCES public.exercises(id) ON DELETE SET NULL;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS player1_score INT DEFAULT 0;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS player2_score INT DEFAULT 0;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS player1_time INT; -- secondes
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS player2_time INT; -- secondes
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS exercise_data JSONB; -- variables générées

-- Table: duel_attempts (tentatives dans un duel)
CREATE TABLE IF NOT EXISTS public.duel_attempts (
  id BIGSERIAL PRIMARY KEY,
  duel_id BIGINT REFERENCES public.duels(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  element_id INT NOT NULL,
  answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent INT, -- millisecondes pour cet élément
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.friend_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: friend_codes
-- ============================================
CREATE POLICY "Users can view own friend code"
  ON public.friend_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own friend code"
  ON public.friend_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend code"
  ON public.friend_codes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permettre la lecture du code par tous (pour trouver l'utilisateur associé)
CREATE POLICY "Anyone can search by friend code"
  ON public.friend_codes FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- POLICIES: friends
-- ============================================
CREATE POLICY "Users can view their friendships"
  ON public.friends FOR SELECT
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

CREATE POLICY "Users can create friendships"
  ON public.friends FOR INSERT
  WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- ============================================
-- POLICIES: friend_requests
-- ============================================
CREATE POLICY "Users can view friend requests involving them"
  ON public.friend_requests FOR SELECT
  USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update friend requests they received"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- ============================================
-- POLICIES: duel_attempts
-- ============================================
CREATE POLICY "Users can view their own duel attempts"
  ON public.duel_attempts FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own duel attempts"
  ON public.duel_attempts FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Permettre aux joueurs du duel de voir toutes les tentatives
CREATE POLICY "Duel players can view all attempts in their duel"
  ON public.duel_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.duels 
      WHERE duels.id = duel_attempts.duel_id 
      AND (duels.player1_id = auth.uid() OR duels.player2_id = auth.uid())
    )
  );

-- Mise à jour de la policy duels pour prendre en compte les nouvelles colonnes
DROP POLICY IF EXISTS "Users can create duels" ON public.duels;
CREATE POLICY "Users can create duels"
  ON public.duels FOR INSERT
  WITH CHECK (auth.uid() = player1_id);

DROP POLICY IF EXISTS "Users can view their duels" ON public.duels;
CREATE POLICY "Users can view their duels"
  ON public.duels FOR SELECT
  USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- Permettre la mise à jour des duels (pour accepter, terminer, etc.)
CREATE POLICY "Users can update duels they are part of"
  ON public.duels FOR UPDATE
  USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  )
  WITH CHECK (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_friend_codes_code ON public.friend_codes(code);
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON public.friends(user1_id);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON public.friends(user2_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON public.friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON public.friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_duels_status ON public.duels(status);
CREATE INDEX IF NOT EXISTS idx_duels_exercise ON public.duels(exercise_id);
CREATE INDEX IF NOT EXISTS idx_duel_attempts_duel ON public.duel_attempts(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_attempts_player ON public.duel_attempts(player_id);

-- ============================================
-- FUNCTION: Auto-generate friend code on user creation
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_random_code(length INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Évite les caractères ambigus (I, O, 0, 1)
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_friend_code_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Générer un code unique
  LOOP
    new_code := public.generate_random_code(8);
    SELECT EXISTS(SELECT 1 FROM public.friend_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Insérer le code
  INSERT INTO public.friend_codes (user_id, code)
  VALUES (NEW.id, new_code);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un code d'ami automatiquement
DROP TRIGGER IF EXISTS on_user_created_generate_friend_code ON auth.users;
CREATE TRIGGER on_user_created_generate_friend_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_code_for_new_user();

-- ============================================
-- FUNCTION: Accepter automatiquement l'amitié
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une demande d'ami est acceptée, créer la relation d'amitié
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friends (user1_id, user2_id, status)
    VALUES (
      LEAST(NEW.from_user_id, NEW.to_user_id),
      GREATEST(NEW.from_user_id, NEW.to_user_id),
      'accepted'
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.handle_friend_request_acceptance();
