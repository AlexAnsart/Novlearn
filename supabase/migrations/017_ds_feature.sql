-- Migration 017 : Fonctionnalité DS (Devoir Surveillé)
-- Tables : ds, ds_competence_scores
-- RLS policies et indexes

-- ============================================================
-- TABLE ds
-- ============================================================
CREATE TABLE IF NOT EXISTS ds (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title          TEXT NOT NULL,
    deadline       TIMESTAMPTZ NOT NULL,
    competence_ids TEXT[] NOT NULL DEFAULT '{}',
    current_streak INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE ds_competence_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS ds_competence_scores (
    ds_id          UUID NOT NULL REFERENCES ds(id) ON DELETE CASCADE,
    competence_id  TEXT NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
    points         INT NOT NULL DEFAULT 0,
    max_points     INT NOT NULL DEFAULT 10,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ds_id, competence_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE ds ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir et modifier que ses propres DS
CREATE POLICY "ds_select_own" ON ds
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ds_insert_own" ON ds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ds_update_own" ON ds
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ds_delete_own" ON ds
    FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE ds_competence_scores ENABLE ROW LEVEL SECURITY;

-- Les scores DS sont accessibles uniquement si l'utilisateur possède le DS
CREATE POLICY "ds_scores_select_own" ON ds_competence_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ds
            WHERE ds.id = ds_competence_scores.ds_id
              AND ds.user_id = auth.uid()
        )
    );

CREATE POLICY "ds_scores_insert_own" ON ds_competence_scores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ds
            WHERE ds.id = ds_competence_scores.ds_id
              AND ds.user_id = auth.uid()
        )
    );

CREATE POLICY "ds_scores_update_own" ON ds_competence_scores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ds
            WHERE ds.id = ds_competence_scores.ds_id
              AND ds.user_id = auth.uid()
        )
    );

CREATE POLICY "ds_scores_delete_own" ON ds_competence_scores
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ds
            WHERE ds.id = ds_competence_scores.ds_id
              AND ds.user_id = auth.uid()
        )
    );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ds_user_id ON ds(user_id);
CREATE INDEX IF NOT EXISTS idx_ds_deadline ON ds(deadline);
CREATE INDEX IF NOT EXISTS idx_ds_competence_scores_ds_id ON ds_competence_scores(ds_id);
