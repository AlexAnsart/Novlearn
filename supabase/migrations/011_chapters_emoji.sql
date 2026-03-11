-- ============================================
-- Ajout de la colonne emoji sur la table chapters
-- ============================================

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '📚';

-- Mise à jour des emojis pour les chapitres existants
UPDATE public.chapters SET emoji = '📊' WHERE name = 'Suites numériques';
UPDATE public.chapters SET emoji = '➡️'  WHERE name = 'Limites et continuité';
UPDATE public.chapters SET emoji = '📈' WHERE name = 'Dérivation et Fonctions';
UPDATE public.chapters SET emoji = '📉' WHERE name = 'Logarithme néperien';
UPDATE public.chapters SET emoji = '∫'  WHERE name = 'Primitives et équadiff';
UPDATE public.chapters SET emoji = '⌒'  WHERE name = 'Convexité';
UPDATE public.chapters SET emoji = '📊' WHERE name = 'Stats';
UPDATE public.chapters SET emoji = '🎲' WHERE name = 'Probas';
