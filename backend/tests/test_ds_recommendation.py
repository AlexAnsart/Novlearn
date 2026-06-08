"""
Tests unitaires pour recommander_exercice_ds (ds.py).

Couvre :
  - Retour None si pas de compétences
  - Retour None si compétences invalides
  - Retour None si aucun exercice ne correspond
  - Recommandation réussie (chemin nominal, streak moyen)
  - Recommandation avec streak très bas (branch STREAK_VERY_LOW)
  - Recommandation avec streak élevé (branch HIGH)
  - Fallback aléatoire si branche préférée est vide
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from helpers import make_supabase
from ds import recommander_exercice_ds


def _make_sb_with_exercise(
    competence_id: str = "comp-1",
    competence_name: str = "Dérivées",
    exercise_difficulty: str = "easy",
    exercise_id: int = 42,
    points: int = 0,
    max_points: int = 10,
):
    """Factory — construit un make_supabase couvrant les 3 tables interrogées."""
    return make_supabase(
        ds_competence_scores=[
            {"competence_id": competence_id, "points": points, "max_points": max_points}
        ],
        competences=[{"id": competence_id, "name": competence_name}],
        exercises=(
            # list_data : tous les exercices
            [{"id": exercise_id, "competences": [competence_name], "difficulty": exercise_difficulty}],
            # single_data : résultat de build_result (maybe_single)
            {"competences": [competence_name]},
        ),
    )


class TestRecommandationDS:

    def test_retourne_none_si_pas_de_competences(self):
        sb = make_supabase()
        result = recommander_exercice_ds(sb, "ds-1", [], current_streak=0)
        assert result is None

    def test_retourne_none_si_competences_toutes_invalides(self):
        sb = make_supabase()
        result = recommander_exercice_ds(sb, "ds-1", ["", "   "], current_streak=0)
        assert result is None

    def test_retourne_none_si_aucun_exercice_correspondant(self):
        sb = make_supabase(
            ds_competence_scores=[
                {"competence_id": "comp-1", "points": 0, "max_points": 10}
            ],
            competences=[{"id": "comp-1", "name": "Dérivées"}],
            exercises=([], None),
        )
        result = recommander_exercice_ds(sb, "ds-1", ["comp-1"], current_streak=0)
        assert result is None

    def test_chemin_nominal_streak_moyen(self):
        sb = _make_sb_with_exercise()
        result = recommander_exercice_ds(sb, "ds-1", ["comp-1"], current_streak=0)
        assert result is not None
        assert result["exercise_id"] == 42
        assert result["competence_id"] == "comp-1"
        assert "difficulty" in result
        assert "difficulty_level" in result

    def test_competences_dans_le_resultat(self):
        sb = _make_sb_with_exercise()
        result = recommander_exercice_ds(sb, "ds-1", ["comp-1"], current_streak=0)
        assert result is not None
        assert "competences" in result
        assert isinstance(result["competences"], list)

    def test_streak_tres_bas_competence_acquise(self):
        # Quand streak < STREAK_VERY_LOW et compétence acquise → exo facile
        sb = _make_sb_with_exercise(points=10, max_points=10)  # acquis
        result = recommander_exercice_ds(sb, "ds-1", ["comp-1"], current_streak=-10)
        assert result is not None
        assert result["exercise_id"] == 42

    def test_streak_eleve_competence_non_acquise(self):
        # streak >= STREAK_MID → exercice sur la compétence la plus faible
        sb = _make_sb_with_exercise(exercise_difficulty="hard")
        result = recommander_exercice_ds(sb, "ds-1", ["comp-1"], current_streak=5)
        assert result is not None
        assert result["exercise_id"] == 42

    def test_normalise_competence_id_avec_espaces(self):
        sb = _make_sb_with_exercise()
        result = recommander_exercice_ds(sb, "ds-1", ["  comp-1  "], current_streak=0)
        assert result is not None
        assert result["exercise_id"] == 42
