-- Migration 019 : Suppression des tables de test de placement (chapitre)
-- Ces tables (user_chapter_test_completed, user_chapter_test_state) ont été
-- supprimées en production — cette migration aligne les migrations locales.

DROP TABLE IF EXISTS public.user_chapter_test_completed CASCADE;
DROP TABLE IF EXISTS public.user_chapter_test_state CASCADE;
