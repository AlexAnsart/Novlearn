-- Migration 031 : Préférences de notifications + table push_subscriptions

-- Ajouter les colonnes de préférences dans profiles
ALTER TABLE profiles
  ADD COLUMN notif_pwa        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN notif_email      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN notif_newsletter BOOLEAN NOT NULL DEFAULT false;

-- Table pour stocker les souscriptions Web Push API
CREATE TABLE push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_user_policy"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
