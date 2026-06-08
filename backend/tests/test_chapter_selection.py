"""
Tests unitaires pour chapter_selection.py

Couvre :
  - _choix_de_chapitre (pure function — sélection par score + streak)
  - _get_chapters_with_exercises (DB mockée)
  - _compute_chapter_scores (DB mockée + get_competences mocké)
  - select_chapter_for_recommendation (intégration des sous-fonctions)
"""
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from helpers import make_supabase
from chapter_selection import (
    _choix_de_chapitre,
    _get_chapters_with_exercises,
    _compute_chapter_scores,
    select_chapter_for_recommendation,
)


# ── _choix_de_chapitre ────────────────────────────────────────────────────────

class TestChoixDeChapitre:
    """La fonction sélectionne un chapitre selon scores [0-100] et streak."""

    def test_raise_si_dico_vide(self):
        with pytest.raises(ValueError):
            _choix_de_chapitre({})

    def test_streak_negatif_choisit_chapitre_fort(self):
        # streak < 1 → chapitres forts (score >= 70) pour regagner confiance
        dico = {"faible": 10.0, "moyen": 50.0, "fort": 80.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=-3) == "fort"

    def test_streak_zero_choisit_chapitre_fort(self):
        dico = {"faible": 20.0, "fort": 85.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=0) == "fort"

    def test_streak_negatif_fallback_moyen_si_pas_de_fort(self):
        dico = {"faible": 10.0, "moyen": 50.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=-1) == "moyen"

    def test_streak_negatif_fallback_faible_si_rien_dautre(self):
        dico = {"faible": 10.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=-2) == "faible"

    def test_streak_moyen_choisit_chapitre_moyen(self):
        # streak 1-2 → chapitres moyens (30 <= score < 70)
        dico = {"faible": 20.0, "moyen": 50.0, "fort": 80.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=1) == "moyen"

    def test_streak_moyen_fallback_fort_si_pas_de_moyen(self):
        dico = {"faible": 20.0, "fort": 80.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=2) == "fort"

    def test_streak_moyen_fallback_faible_si_uniquement_faible(self):
        dico = {"faible": 20.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=1) == "faible"

    def test_streak_eleve_choisit_chapitre_faible(self):
        # streak >= 3 → chapitres faibles (score < 30) pour se challenger
        dico = {"faible": 10.0, "moyen": 50.0, "fort": 80.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=5) == "faible"

    def test_streak_eleve_fallback_moyen_si_pas_de_faible(self):
        dico = {"moyen": 50.0, "fort": 80.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=3) == "moyen"

    def test_streak_eleve_fallback_fort_en_dernier_recours(self):
        dico = {"fort": 90.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=10) == "fort"

    def test_un_seul_chapitre_retourne_ce_chapitre(self):
        assert _choix_de_chapitre({"seul": 50.0}, streak=10) == "seul"

    def test_plusieurs_forts_retourne_un_fort(self):
        dico = {"fort1": 75.0, "fort2": 90.0}
        for _ in range(30):
            assert _choix_de_chapitre(dico, streak=-1) in ("fort1", "fort2")

    def test_score_exactement_a_30_est_moyen(self):
        # 30 >= score → moyen ; < 30 → faible
        dico = {"exactement_30": 30.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=0) == "exactement_30"

    def test_score_exactement_a_70_est_fort(self):
        dico = {"exactement_70": 70.0}
        for _ in range(20):
            assert _choix_de_chapitre(dico, streak=0) == "exactement_70"


# ── _get_chapters_with_exercises ──────────────────────────────────────────────

class TestGetChaptersWithExercises:

    def test_retourne_set_de_chapitres(self):
        sb = make_supabase(exercises=[
            {"chapter": "Fonctions"},
            {"chapter": "Suites numériques"},
            {"chapter": "Fonctions"},  # doublon → ignoré
        ])
        with patch("chapter_selection.CHAPTER_DB_ALIASES", {}):
            result = _get_chapters_with_exercises(sb)
        assert "Fonctions" in result
        assert "Suites numériques" in result
        assert len(result) == 2

    def test_ignore_chapitres_vides_ou_nuls(self):
        sb = make_supabase(exercises=[
            {"chapter": ""},
            {"chapter": None},
            {"chapter": "Géométrie"},
        ])
        with patch("chapter_selection.CHAPTER_DB_ALIASES", {}):
            result = _get_chapters_with_exercises(sb)
        assert "Géométrie" in result
        assert "" not in result
        assert None not in result

    def test_retourne_set_vide_si_pas_dexercices(self):
        sb = make_supabase(exercises=[])
        with patch("chapter_selection.CHAPTER_DB_ALIASES", {}):
            result = _get_chapters_with_exercises(sb)
        assert isinstance(result, set)
        assert len(result) == 0

    def test_applique_aliases(self):
        sb = make_supabase(exercises=[{"chapter": "Suites et limites"}])
        aliases = {"Suites numériques": ["Suites et limites"]}
        with patch("chapter_selection.CHAPTER_DB_ALIASES", aliases):
            result = _get_chapters_with_exercises(sb)
        assert "Suites numériques" in result


# ── _compute_chapter_scores ───────────────────────────────────────────────────

class TestComputeChapterScores:

    def test_score_nul_si_aucun_point_utilisateur(self):
        sb = make_supabase(user_competence_scores=[])
        with patch("chapter_selection.get_chapters_with_competences", return_value=["Fonctions"]):
            with patch("chapter_selection.get_competences", return_value={"comp-1": 10, "comp-2": 10}):
                scores = _compute_chapter_scores(sb, "user-1")
        assert scores["Fonctions"] == 0.0

    def test_score_calcule_correctement(self):
        # user a 5/10 + 10/10 = 15/20 = 75%
        sb = make_supabase(user_competence_scores=[
            {"competence_id": "comp-1", "points": 5},
            {"competence_id": "comp-2", "points": 10},
        ])
        with patch("chapter_selection.get_chapters_with_competences", return_value=["Maths"]):
            with patch("chapter_selection.get_competences", return_value={"comp-1": 10, "comp-2": 10}):
                scores = _compute_chapter_scores(sb, "user-1")
        assert scores["Maths"] == 75.0

    def test_score_capped_a_100(self):
        sb = make_supabase(user_competence_scores=[
            {"competence_id": "comp-1", "points": 999},
        ])
        with patch("chapter_selection.get_chapters_with_competences", return_value=["Maths"]):
            with patch("chapter_selection.get_competences", return_value={"comp-1": 10}):
                scores = _compute_chapter_scores(sb, "user-1")
        assert scores["Maths"] == 100.0

    def test_plusieurs_chapitres(self):
        sb = make_supabase(user_competence_scores=[
            {"competence_id": "c1", "points": 10},
            {"competence_id": "c2", "points": 0},
        ])

        def mock_get_competences(chapter=None, **_):
            return {"c1": 10} if chapter == "A" else {"c2": 10}

        with patch("chapter_selection.get_chapters_with_competences", return_value=["A", "B"]):
            with patch("chapter_selection.get_competences", side_effect=mock_get_competences):
                scores = _compute_chapter_scores(sb, "user-1")
        assert scores["A"] == 100.0
        assert scores["B"] == 0.0


# ── select_chapter_for_recommendation ─────────────────────────────────────────

class TestSelectChapterForRecommendation:

    def test_retourne_none_si_pas_de_chapitres_avec_competences(self):
        sb = make_supabase(exercises=[], user_competence_scores=[])
        with patch("chapter_selection.get_chapters_with_competences", return_value=[]):
            with patch("chapter_selection.CHAPTER_DB_ALIASES", {}):
                result = select_chapter_for_recommendation(sb, "user-1")
        assert result is None

    def test_retourne_none_si_pas_dexercices(self):
        # Chapitres définis mais aucun exercice en DB
        sb = make_supabase(exercises=[], user_competence_scores=[])
        with patch("chapter_selection.get_chapters_with_competences", return_value=["Fonctions"]):
            with patch("chapter_selection.CHAPTER_DB_ALIASES", {}):
                result = select_chapter_for_recommendation(sb, "user-1")
        assert result is None

    def test_retourne_un_chapitre_disponible(self):
        sb = make_supabase(
            exercises=[{"chapter": "Fonctions"}],
            user_competence_scores=[],
        )
        with patch("chapter_selection.get_chapters_with_competences", return_value=["Fonctions"]):
            with patch("chapter_selection.get_competences", return_value={"comp-1": 10}):
                with patch("chapter_selection.compute_streak", return_value=0):
                    with patch("chapter_selection.CHAPTER_DB_ALIASES", {}):
                        result = select_chapter_for_recommendation(sb, "user-1")
        assert result == "Fonctions"
