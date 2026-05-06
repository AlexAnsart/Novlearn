-- Migration 034 : Paramètres de notifications granulaires
-- Remplace les toggles globaux (notif_pwa, notif_email) par des réglages spécifiques
-- (Défis, Rappels Quotidiens)

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notif_push_duels BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notif_push_daily BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notif_email_duels BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notif_email_daily BOOLEAN DEFAULT false;

-- 2. Migrer les données existantes pour ne pas perdre les préférences des utilisateurs actuels
UPDATE public.profiles
SET 
  notif_push_duels = COALESCE(notif_pwa, false),
  notif_push_daily = COALESCE(notif_pwa, false),
  notif_email_duels = COALESCE(notif_email, false),
  notif_email_daily = COALESCE(notif_email, false);

-- 3. Supprimer les anciennes colonnes globales
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS notif_pwa,
DROP COLUMN IF EXISTS notif_email;
