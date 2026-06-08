"""
Tests pour le moteur de recommandation (backend/recommandation.py).

Couvre :
  Fonctions pures :
    - _tri_fusion_par_ratio : tri fusion sur ratios
    - _fusion               : étape de fusion
    - _choisir_difficulte   : sélection de niveau selon ratio de confiance
    - _pick_exercise_id     : sélection aléatoire dans une liste

  Intégration (mock DB) :
    - recommander_exercice avec les 4 branches de streak
    - fallback si pas de compétences / pas d'exercices
    - structure du résultat
"""
import pytest
from helpers import make_supabase
from recommandation import (
    _choisir_difficulte,
    _fusion,
    _pick_exercise_id,
    _tri_fusion_par_ratio,
    recommander_exercice,
)


# ──────────────────────────────────────────────────────────────────────────────
# _tri_fusion_par_ratio
# ──────────────────────────────────────────────────────────────────────────────

class TestTriFusionParRatio:

    def test_empty(self):
        assert _tri_fusion_par_ratio([]) == []

    def test_single_element(self):
        assert _tri_fusion_par_ratio([("a", 0.5)]) == [("a", 0.5)]

    def test_two_already_sorted(self):
        assert _tri_fusion_par_ratio([("a", 0.2), ("b", 0.8)]) == [("a", 0.2), ("b", 0.8)]

    def test_two_reversed(self):
        assert _tri_fusion_par_ratio([("b", 0.8), ("a", 0.2)]) == [("a", 0.2), ("b", 0.8)]

    def test_multiple_elements_sorted_ascending(self):
        data = [("e", 1.0), ("c", 0.5), ("a", 0.1), ("d", 0.8), ("b", 0.3)]
        result = _tri_fusion_par_ratio(data)
        ratios = [r[1] for r in result]
        assert ratios == sorted(ratios)

    def test_preserves_all_elements(self):
        data = [("x", 0.9), ("y", 0.1), ("z", 0.5)]
        result = _tri_fusion_par_ratio(data)
        assert len(result) == 3
        assert set(r[0] for r in result) == {"x", "y", "z"}

    def test_equal_ratios(self):
        data = [("a", 0.5), ("b", 0.5), ("c", 0.5)]
        result = _tri_fusion_par_ratio(data)
        assert len(result) == 3
        assert all(r[1] == 0.5 for r in result)


# ──────────────────────────────────────────────────────────────────────────────
# _fusion
# ──────────────────────────────────────────────────────────────────────────────

class TestFusion:

    def test_left_empty(self):
        assert _fusion([], [("a", 0.3)]) == [("a", 0.3)]

    def test_right_empty(self):
        assert _fusion([("a", 0.3)], []) == [("a", 0.3)]

    def test_both_empty(self):
        assert _fusion([], []) == []

    def test_merges_in_order(self):
        l1 = [("a", 0.1), ("c", 0.5)]
        l2 = [("b", 0.3), ("d", 0.7)]
        result = _fusion(l1, l2)
        assert [r[1] for r in result] == [0.1, 0.3, 0.5, 0.7]

    def test_already_sorted_merged(self):
        l1 = [("a", 0.1)]
        l2 = [("b", 0.9)]
        assert _fusion(l1, l2) == [("a", 0.1), ("b", 0.9)]


# ──────────────────────────────────────────────────────────────────────────────
# _choisir_difficulte
# ──────────────────────────────────────────────────────────────────────────────

class TestChoisirDifficulte:
    """
    easy_max=0.5, medium_max=0.9 dans les tests.
    ratio < easy_max → 0 (facile)
    easy_max ≤ ratio < medium_max → 1 (moyen)
    ratio ≥ medium_max → 2 (difficile)
    """

    def test_below_easy_max_is_easy(self):
        assert _choisir_difficulte(0.3, 0.5, 0.9) == 0

    def test_at_easy_max_is_medium(self):
        # 0.5 n'est pas < 0.5 → moyen
        assert _choisir_difficulte(0.5, 0.5, 0.9) == 1

    def test_between_easy_and_medium_is_medium(self):
        assert _choisir_difficulte(0.7, 0.5, 0.9) == 1

    def test_at_medium_max_is_hard(self):
        # 0.9 n'est pas < 0.9 → difficile
        assert _choisir_difficulte(0.9, 0.5, 0.9) == 2

    def test_above_medium_max_is_hard(self):
        assert _choisir_difficulte(0.95, 0.5, 0.9) == 2

    def test_zero_ratio_is_easy(self):
        assert _choisir_difficulte(0.0, 0.5, 0.9) == 0

    def test_perfect_ratio_is_hard(self):
        assert _choisir_difficulte(1.0, 0.5, 0.9) == 2


# ──────────────────────────────────────────────────────────────────────────────
# _pick_exercise_id
# ──────────────────────────────────────────────────────────────────────────────

class TestPickExerciseId:

    def test_empty_returns_none(self):
        assert _pick_exercise_id([]) is None

    def test_single_element_returns_it(self):
        assert _pick_exercise_id([42]) == 42

    def test_picks_element_from_list(self):
        ids = [10, 20, 30, 40]
        assert _pick_exercise_id(ids) in ids

    def test_always_returns_from_list(self):
        ids = [7]
        for _ in range(20):
            assert _pick_exercise_id(ids) == 7


# ──────────────────────────────────────────────────────────────────────────────
# recommander_exercice (intégration avec mock DB)
# ──────────────────────────────────────────────────────────────────────────────

class TestRecommandationExercice:
    """
    On monke get_competences pour éviter l'appel Supabase dans les settings.
    Le profile mock fournit current_streak (évite l'appel compute_streak).
    """

    def _exercises_for(self, competence_id, exercise_id=101, difficulty="easy"):
        """Helper : liste + single_data pour la table exercises."""
        return (
            [{"id": exercise_id, "competences": [competence_id], "difficulty": difficulty, "chapter": "ch"}],
            {"competences": [competence_id]},
        )

    def test_high_streak_selects_weakest_competence(self, monkeypatch):
        """streak >= STREAK_MID=2 → comp la plus faible (non_acquises[0])."""
        monkeypatch.setattr(
            "recommandation.get_competences",
            lambda **k: {"comp_forte": 10, "comp_faible": 10},
        )
        client = make_supabase(
            # current_streak=5 pour éviter l'appel compute_streak
            profiles=([], {"hidden_chapters": [], "current_streak": 5}),
            user_competence_scores=[
                {"competence_id": "comp_forte", "points": 9},  # ratio 0.9
                {"competence_id": "comp_faible", "points": 1},  # ratio 0.1 ← plus faible
            ],
            exercises=(
                [
                    {"id": 101, "competences": ["comp_faible"], "difficulty": "easy", "chapter": "ch"},
                    {"id": 202, "competences": ["comp_forte"],  "difficulty": "easy", "chapter": "ch"},
                ],
                {"competences": ["comp_faible"]},
            ),
        )
        result = recommander_exercice(client, "u1")
        assert result is not None
        assert result["exercise_id"] == 101

    def test_very_low_streak_uses_acquired_competence(self, monkeypatch):
        """streak < STREAK_VERY_LOW=-5 + compétences acquises → exercice sur comp acquise."""
        monkeypatch.setattr(
            "recommandation.get_competences",
            lambda **k: {"comp_acquise": 10},
        )
        client = make_supabase(
            profiles=([], {"hidden_chapters": [], "current_streak": -7}),
            user_competence_scores=[
                {"competence_id": "comp_acquise", "points": 10},  # 10/10 → acquise
            ],
            exercises=self._exercises_for("comp_acquise", 50),
        )
        result = recommander_exercice(client, "u1")
        assert result is not None
        assert result["exercise_id"] == 50

    def test_no_competences_triggers_fallback_random(self, monkeypatch):
        """Pas de compétences disponibles → fallback exercice aléatoire."""
        monkeypatch.setattr("recommandation.get_competences", lambda **k: {})
        client = make_supabase(
            profiles=([], None),
            exercises=[{"id": 999, "competences": ["x"], "difficulty": "easy", "chapter": "ch"}],
        )
        result = recommander_exercice(client, "u1")
        assert result is not None
        assert result["exercise_id"] == 999

    def test_no_exercises_returns_none(self, monkeypatch):
        """Pas d'exercices du tout → None."""
        monkeypatch.setattr("recommandation.get_competences", lambda **k: {})
        client = make_supabase(profiles=([], None), exercises=[])
        assert recommander_exercice(client, "u1") is None

    def test_result_has_required_keys(self, monkeypatch):
        """Le dict retourné contient toutes les clés attendues par l'API."""
        monkeypatch.setattr(
            "recommandation.get_competences",
            lambda **k: {"comp_x": 10},
        )
        client = make_supabase(
            profiles=([], {"hidden_chapters": [], "current_streak": 0}),
            user_competence_scores=[{"competence_id": "comp_x", "points": 5}],
            exercises=self._exercises_for("comp_x", 77, "medium"),
        )
        result = recommander_exercice(client, "u1")
        assert result is not None
        for key in ("exercise_id", "competence_id", "competences", "difficulty_level", "difficulty"):
            assert key in result, f"Clé manquante : {key}"
        assert isinstance(result["competences"], list)

    def test_competences_are_array(self, monkeypatch):
        """Le champ 'competences' est toujours une liste."""
        monkeypatch.setattr(
            "recommandation.get_competences",
            lambda **k: {"comp_a": 10, "comp_b": 10},
        )
        client = make_supabase(
            profiles=([], {"hidden_chapters": [], "current_streak": 1}),
            user_competence_scores=[
                {"competence_id": "comp_a", "points": 3},
                {"competence_id": "comp_b", "points": 7},
            ],
            exercises=(
                [{"id": 55, "competences": ["comp_a", "comp_b"], "difficulty": "easy", "chapter": "ch"}],
                {"competences": ["comp_a", "comp_b"]},
            ),
        )
        result = recommander_exercice(client, "u1")
        assert result is not None
        assert isinstance(result["competences"], list)

    def test_difficulty_level_matches_difficulty_string(self, monkeypatch):
        """difficulty_level et difficulty sont cohérents."""
        monkeypatch.setattr(
            "recommandation.get_competences",
            lambda **k: {"comp_y": 10},
        )
        client = make_supabase(
            profiles=([], {"hidden_chapters": [], "current_streak": 0}),
            user_competence_scores=[{"competence_id": "comp_y", "points": 5}],
            exercises=self._exercises_for("comp_y", 88, "hard"),
        )
        result = recommander_exercice(client, "u1")
        assert result is not None
        mapping = {0: "easy", 1: "medium", 2: "hard"}
        assert result["difficulty"] == mapping[result["difficulty_level"]]
