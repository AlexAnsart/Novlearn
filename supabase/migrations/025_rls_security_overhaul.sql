-- Migration 025 : Refonte complète des politiques RLS
-- Remplace toutes les anciennes politiques par l'état de production :
--   • Noms en français
--   • Pattern sécurisé (SELECT auth.uid() AS uid) (anti-IDOR)
--   • Politiques "No guest access" sur les tables sensibles
--   • Protection anti-escalade de rôle sur profiles
--   • FK supplémentaires friends/friend_requests → profiles

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can read profiles for leaderboard" ON public.profiles;

CREATE POLICY "No guest access to profiles"
  ON public.profiles FOR ALL
  USING (NOT is_guest());

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Tous les utilisateurs authentifiés peuvent lire les profils des autres (pour le classement, duels, etc.)
CREATE POLICY "profiles_select_others"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Mise à jour : interdit de changer son propre rôle
CREATE POLICY "profiles_update_own_no_role_change"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = get_my_role());

-- ============================================================
-- EXERCISES
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view exercises" ON public.exercises;

CREATE POLICY "Tout le monde peut voir les exercices"
  ON public.exercises FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Utilisateurs authentifiés peuvent voir les exercices"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- EXERCISE_ATTEMPTS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own attempts"   ON public.exercise_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.exercise_attempts;

CREATE POLICY "No guest access to exercise_attempts"
  ON public.exercise_attempts FOR ALL
  USING (NOT is_guest());

CREATE POLICY "L'utilisateur voit ses tentatives"
  ON public.exercise_attempts FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "L'utilisateur ajoute ses tentatives"
  ON public.exercise_attempts FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- DUELS
-- ============================================================
DROP POLICY IF EXISTS "Users can view their duels"           ON public.duels;
DROP POLICY IF EXISTS "Users can create duels"               ON public.duels;
DROP POLICY IF EXISTS "Users can update duels they are part of" ON public.duels;

CREATE POLICY "No guest access to duels"
  ON public.duels FOR ALL
  USING (NOT is_guest());

CREATE POLICY "Voir ses duels"
  ON public.duels FOR SELECT
  USING (
    (SELECT auth.uid()) = player1_id OR
    (SELECT auth.uid()) = player2_id
  );

CREATE POLICY "Créer un duel"
  ON public.duels FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = player1_id);

CREATE POLICY "Mettre à jour ses duels"
  ON public.duels FOR UPDATE
  USING (
    (SELECT auth.uid()) = player1_id OR
    (SELECT auth.uid()) = player2_id
  );

-- ============================================================
-- DUEL_ATTEMPTS
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own duel attempts"          ON public.duel_attempts;
DROP POLICY IF EXISTS "Users can insert their own duel attempts"        ON public.duel_attempts;
DROP POLICY IF EXISTS "Duel players can view all attempts in their duel" ON public.duel_attempts;

CREATE POLICY "Voir les tentatives de son duel"
  ON public.duel_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.duels
      WHERE duels.id = duel_attempts.duel_id
        AND (
          duels.player1_id = (SELECT auth.uid()) OR
          duels.player2_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "Ajouter sa tentative de duel"
  ON public.duel_attempts FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = player_id);

-- ============================================================
-- FRIENDS
-- ============================================================
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can create friendships"     ON public.friends;

CREATE POLICY "No guest access to friends"
  ON public.friends FOR ALL
  USING (NOT is_guest());

CREATE POLICY "Voir ses amis"
  ON public.friends FOR SELECT
  USING (
    (SELECT auth.uid()) = user1_id OR
    (SELECT auth.uid()) = user2_id
  );

CREATE POLICY "Créer une amitié"
  ON public.friends FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user1_id OR
    (SELECT auth.uid()) = user2_id
  );

-- FK friends.user2_id → profiles.id (si absente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name        = 'friends'
      AND constraint_name   = 'fk_friends_user2'
  ) THEN
    ALTER TABLE public.friends
      ADD CONSTRAINT fk_friends_user2
      FOREIGN KEY (user2_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- ============================================================
-- FRIEND_REQUESTS
-- ============================================================
DROP POLICY IF EXISTS "Users can view friend requests involving them"   ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests"                  ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests they received"  ON public.friend_requests;

CREATE POLICY "No guest access to friend_requests"
  ON public.friend_requests FOR ALL
  USING (NOT is_guest());

CREATE POLICY "Voir ses requêtes d'amis"
  ON public.friend_requests FOR SELECT
  USING (
    (SELECT auth.uid()) = from_user_id OR
    (SELECT auth.uid()) = to_user_id
  );

CREATE POLICY "Envoyer une requête d'ami"
  ON public.friend_requests FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = from_user_id);

CREATE POLICY "Répondre à une requête d'ami"
  ON public.friend_requests FOR UPDATE
  USING ((SELECT auth.uid()) = to_user_id);

-- FK friend_requests.from_user_id → profiles.id (si absente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name        = 'friend_requests'
      AND constraint_name   = 'fk_friend_requests_from_user'
  ) THEN
    ALTER TABLE public.friend_requests
      ADD CONSTRAINT fk_friend_requests_from_user
      FOREIGN KEY (from_user_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- ============================================================
-- FRIEND_CODES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own friend code"    ON public.friend_codes;
DROP POLICY IF EXISTS "Users can insert own friend code"  ON public.friend_codes;
DROP POLICY IF EXISTS "Users can update own friend code"  ON public.friend_codes;
DROP POLICY IF EXISTS "Anyone can search by friend code"  ON public.friend_codes;

CREATE POLICY "No guest access to friend_codes"
  ON public.friend_codes FOR ALL
  USING (NOT is_guest());

CREATE POLICY "Voir son propre code ami"
  ON public.friend_codes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Créer son code ami"
  ON public.friend_codes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Modifier son code ami"
  ON public.friend_codes FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Supprimer son code ami"
  ON public.friend_codes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- USER_PROGRESS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own progress"   ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

CREATE POLICY "No guest access to user_progress"
  ON public.user_progress FOR ALL
  USING (NOT is_guest());

CREATE POLICY "L'utilisateur voit sa progression"
  ON public.user_progress FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Insertion progression"
  ON public.user_progress FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Mise à jour progression"
  ON public.user_progress FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- USER_COMPETENCE_SCORES
-- ============================================================
DROP POLICY IF EXISTS "Users can read own competence scores"   ON public.user_competence_scores;
DROP POLICY IF EXISTS "Users can insert own competence scores" ON public.user_competence_scores;
DROP POLICY IF EXISTS "Users can update own competence scores" ON public.user_competence_scores;

CREATE POLICY "No guest access to user_competence_scores"
  ON public.user_competence_scores FOR ALL
  USING (NOT is_guest());

CREATE POLICY "Users can read own competence scores"
  ON public.user_competence_scores FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own competence scores"
  ON public.user_competence_scores FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own competence scores"
  ON public.user_competence_scores FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
