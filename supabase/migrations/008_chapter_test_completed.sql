-- Chapter placement test: track completion and in-progress state
-- Used when a user first visits a chapter (or at signup for default chapter)

CREATE TABLE IF NOT EXISTS public.user_chapter_test_completed (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, chapter)
);

CREATE TABLE IF NOT EXISTS public.user_chapter_test_state (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter TEXT NOT NULL,
  competence_index INT NOT NULL DEFAULT 0,
  exercise_index INT NOT NULL DEFAULT 0,
  last_success BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, chapter)
);

ALTER TABLE public.user_chapter_test_completed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chapter_test_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own chapter test completed" ON public.user_chapter_test_completed;
CREATE POLICY "Users can read own chapter test completed"
  ON public.user_chapter_test_completed FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chapter test completed" ON public.user_chapter_test_completed;
CREATE POLICY "Users can insert own chapter test completed"
  ON public.user_chapter_test_completed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own chapter test state" ON public.user_chapter_test_state;
CREATE POLICY "Users can read own chapter test state"
  ON public.user_chapter_test_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chapter test state" ON public.user_chapter_test_state;
CREATE POLICY "Users can insert own chapter test state"
  ON public.user_chapter_test_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chapter test state" ON public.user_chapter_test_state;
CREATE POLICY "Users can update own chapter test state"
  ON public.user_chapter_test_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_chapter_test_completed_user ON public.user_chapter_test_completed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_test_state_user ON public.user_chapter_test_state(user_id);
