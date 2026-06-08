"""
Tests unitaires pour chapter_placement_test.py

Couvre :
  - _merge_sort, _merge (pure functions — tri par max_points)
  - _apply_scoring (pure function — attribution de points)
  - _pick_next_exercise (pure function — sélection d'exercice selon niveau)
  - _competences_to_test (mockée — liste les compétences à tester)
  - is_chapter_test_completed (DB mockée)
"""
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from helpers import make_supabase
from chapter_placement_test import (
    _merge_sort,
    _merge,
    _apply_scoring,
    _pick_next_exercise,
    _competences_to_test,
    is_chapter_test_completed,
)


# ── _merge_sort ───────────────────────────────────────────────────────────────

class TestMergeSort:

    def test_liste_vide(self):
        assert _merge_sort([]) == []

    def test_liste_un_element(self):
        assert _merge_sort([("a", 5)]) == [("a", 5)]

    def test_deux_elements_en_ordre_croissant(self):
        assert _merge_sort([("a", 3), ("b", 7)]) == [("a", 3), ("b", 7)]

    def test_deux_elements_inverse(self):
        assert _merge_sort([("b", 7), ("a", 3)]) == [("a", 3), ("b", 7)]

    def test_plusieurs_elements_trié_par_max_points(self):
        data = [("c", 10), ("a", 2), ("b", 5)]
        result = _merge_sort(data)
        assert result == [("a", 2), ("b", 5), ("c", 10)]

    def test_valeurs_egales_conservees(self):
        data = [("a", 5), ("b", 5), ("c", 5)]
        result = _merge_sort(data)
        values = [x[1] for x in result]
        assert values == [5, 5, 5]

    def test_ordre_stable_sur_grande_liste(self):
        import random
        data = [(str(i), random.randint(1, 100)) for i in range(50)]
        result = _merge_sort(data[:])
        for i in range(len(result) - 1):
            assert result[i][1] <= result[i + 1][1]


# ── _merge ────────────────────────────────────────────────────────────────────

class TestMerge:

    def test_merge_deux_listes_vides(self):
        assert _merge([], []) == []

    def test_merge_liste_vide_gauche(self):
        assert _merge([], [("a", 1)]) == [("a", 1)]

    def test_merge_liste_vide_droite(self):
        assert _merge([("a", 1)], []) == [("a", 1)]

    def test_merge_deux_listes_triees(self):
        a = [("a", 1), ("c", 3)]
        b = [("b", 2), ("d", 4)]
        result = _merge(a, b)
        assert [x[1] for x in result] == [1, 2, 3, 4]

    def test_merge_listes_avec_valeurs_egales(self):
        a = [("a", 3)]
        b = [("b", 3)]
        result = _merge(a, b)
        assert len(result) == 2
        assert all(x[1] == 3 for x in result)


# ── _apply_scoring ────────────────────────────────────────────────────────────

class TestApplyScoring:
    """Points = int((level + 1) / 10 * max_points), capped à max_points."""

    def test_niveau_0_ajoute_10_pourcent(self):
        points = {}
        _apply_scoring("comp-1", 0, 100, points)
        assert points["comp-1"] == 10

    def test_niveau_1_ajoute_20_pourcent(self):
        points = {}
        _apply_scoring("comp-1", 1, 100, points)
        assert points["comp-1"] == 20

    def test_niveau_2_ajoute_30_pourcent(self):
        points = {}
        _apply_scoring("comp-1", 2, 100, points)
        assert points["comp-1"] == 30

    def test_cap_a_max_points(self):
        points = {"comp-1": 95}
        _apply_scoring("comp-1", 2, 100, points)
        assert points["comp-1"] == 100

    def test_premiere_reponse_part_de_zero(self):
        points = {}
        _apply_scoring("comp-1", 0, 10, points)
        assert points["comp-1"] == 1

    def test_cumul_sur_meme_competence(self):
        points = {}
        _apply_scoring("comp-1", 0, 100, points)
        _apply_scoring("comp-1", 1, 100, points)
        assert points["comp-1"] == 30

    def test_competences_independantes(self):
        points = {}
        _apply_scoring("comp-A", 0, 100, points)
        _apply_scoring("comp-B", 1, 100, points)
        assert points["comp-A"] == 10
        assert points["comp-B"] == 20

    def test_max_points_petit(self):
        points = {}
        _apply_scoring("comp-1", 1, 5, points)
        assert points["comp-1"] == 1  # int((1+1)/10 * 5) = int(1.0) = 1


# ── _pick_next_exercise ───────────────────────────────────────────────────────

class TestPickNextExercise:

    def test_niveau_0_retourne_exercice_facile(self):
        exos = {"comp-1": [[10, 11], [20], [30]]}
        level, ex_id = _pick_next_exercise("comp-1", 0, exos)
        assert level == 0
        assert ex_id in [10, 11]

    def test_niveau_1_retourne_exercice_moyen(self):
        exos = {"comp-1": [[10], [20, 21], [30]]}
        level, ex_id = _pick_next_exercise("comp-1", 1, exos)
        assert level == 1
        assert ex_id in [20, 21]

    def test_niveau_2_retourne_exercice_difficile(self):
        exos = {"comp-1": [[10], [20], [30, 31]]}
        level, ex_id = _pick_next_exercise("comp-1", 2, exos)
        assert level == 2
        assert ex_id in [30, 31]

    def test_niveau_1_fallback_vers_niveau_0_si_liste_vide(self):
        exos = {"comp-1": [[10, 11], [], []]}
        level, ex_id = _pick_next_exercise("comp-1", 1, exos)
        assert level == 0
        assert ex_id in [10, 11]

    def test_niveau_0_retourne_none_si_toutes_listes_vides(self):
        exos = {"comp-1": [[], [], []]}
        level, ex_id = _pick_next_exercise("comp-1", 0, exos)
        assert ex_id is None

    def test_competence_absente_retourne_none(self):
        _, ex_id = _pick_next_exercise("absent", 0, {})
        assert ex_id is None

    def test_fallback_vers_premier_niveau_disponible(self):
        # Seul le niveau difficile a des exercices
        exos = {"comp-1": [[], [], [99]]}
        level, ex_id = _pick_next_exercise("comp-1", 0, exos)
        assert ex_id == 99


# ── _competences_to_test ─────────────────────────────────────────────────────

class TestCompetencesToTest:

    def test_retourne_liste_vide_si_aucune_competence(self):
        with patch("chapter_placement_test.get_competences", return_value={}):
            result = _competences_to_test("Fonctions")
        assert result == []

    def test_retourne_competences_triees_par_max_points(self):
        comps = {"comp-a": 10, "comp-b": 5, "comp-c": 8}
        with patch("chapter_placement_test.get_competences", return_value=comps):
            result = _competences_to_test("Fonctions")
        values = [x[1] for x in result]
        assert values == sorted(values)

    def test_limite_a_10_competences(self):
        comps = {f"comp-{i}": i for i in range(20)}
        with patch("chapter_placement_test.get_competences", return_value=comps):
            result = _competences_to_test("Fonctions")
        assert len(result) <= 10

    def test_une_seule_competence(self):
        with patch("chapter_placement_test.get_competences", return_value={"c1": 7}):
            result = _competences_to_test("Fonctions")
        assert result == [("c1", 7)]


# ── is_chapter_test_completed ─────────────────────────────────────────────────

class TestIsChapterTestCompleted:

    def test_retourne_true_si_test_complété(self):
        sb = make_supabase(user_chapter_test_completed=[{"chapter": "Fonctions"}])
        result = is_chapter_test_completed(sb, "user-1", "Fonctions")
        assert result is True

    def test_retourne_false_si_aucun_enregistrement(self):
        sb = make_supabase(user_chapter_test_completed=[])
        result = is_chapter_test_completed(sb, "user-1", "Fonctions")
        assert result is False

    def test_retourne_false_si_exception_supabase(self):
        from unittest.mock import MagicMock
        sb = MagicMock()
        sb.table.side_effect = Exception("Connexion échouée")
        result = is_chapter_test_completed(sb, "user-1", "Fonctions")
        assert result is False
