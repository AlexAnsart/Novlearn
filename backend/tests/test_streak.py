"""
Tests pour streak.compute_streak (backend/streak.py).

Couvre :
  - Retour zéro si aucune tentative
  - Série de succès consécutifs (positif)
  - Série d'échecs consécutifs (négatif)
  - Rupture de série
  - Paramètre window
  - Filtrage par chapitre
"""
from helpers import make_supabase
from streak import compute_streak


# ── Helpers ───────────────────────────────────────────────────────────────────

def _attempts(*is_correct_values):
    """Construit une liste d'attempts (plus récent en premier = index 0)."""
    return [
        {
            "exercise_id": i + 1,
            "is_correct": v,
            "attempted_at": f"2024-01-{i + 1:02d}T10:00:00",
        }
        for i, v in enumerate(is_correct_values)
    ]


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestComputeStreak:

    def test_empty_returns_zero(self):
        client = make_supabase(exercise_attempts=[])
        assert compute_streak(client, "u1") == 0

    def test_three_correct_returns_three(self):
        # [True, True, True, False] → 3 consécutifs corrects
        client = make_supabase(exercise_attempts=_attempts(True, True, True, False))
        assert compute_streak(client, "u1") == 3

    def test_three_incorrect_returns_minus_three(self):
        # [False, False, False, True] → 3 consécutifs incorrects
        client = make_supabase(exercise_attempts=_attempts(False, False, False, True))
        assert compute_streak(client, "u1") == -3

    def test_single_correct_returns_one(self):
        client = make_supabase(exercise_attempts=_attempts(True))
        assert compute_streak(client, "u1") == 1

    def test_single_incorrect_returns_minus_one(self):
        client = make_supabase(exercise_attempts=_attempts(False))
        assert compute_streak(client, "u1") == -1

    def test_latest_correct_after_incorrect_streak(self):
        # [True, False, False] → 1 correct en tête
        client = make_supabase(exercise_attempts=_attempts(True, False, False))
        assert compute_streak(client, "u1") == 1

    def test_latest_incorrect_after_correct_streak(self):
        # [False, True, True] → 1 incorrect en tête
        client = make_supabase(exercise_attempts=_attempts(False, True, True))
        assert compute_streak(client, "u1") == -1

    def test_all_correct(self):
        client = make_supabase(exercise_attempts=_attempts(True, True, True, True, True))
        assert compute_streak(client, "u1") == 5

    def test_all_incorrect(self):
        client = make_supabase(exercise_attempts=_attempts(False, False, False))
        assert compute_streak(client, "u1") == -3

    def test_window_zero_returns_zero(self):
        client = make_supabase(exercise_attempts=_attempts(True, True))
        assert compute_streak(client, "u1", window=0) == 0

    def test_window_limits_fetch(self):
        """window=3 → seules 3 tentatives récupérées (le False en 4e position ignoré)."""
        # [True, True, True, False] ; window=3 → limite le fetch à 3 → streak 3
        client = make_supabase(exercise_attempts=_attempts(True, True, True, False))
        assert compute_streak(client, "u1", window=3) == 3

    def test_chapter_filter_counts_only_target_chapter(self):
        """Filtre chapitre : seules les tentatives du bon chapitre comptent."""
        attempts = [
            {"exercise_id": 10, "is_correct": True,  "attempted_at": "2024-01-03T10:00:00"},
            {"exercise_id": 20, "is_correct": False, "attempted_at": "2024-01-02T10:00:00"},
            {"exercise_id": 10, "is_correct": True,  "attempted_at": "2024-01-01T10:00:00"},
        ]
        exercises = [
            {"id": 10, "chapter": "Algèbre"},
            {"id": 20, "chapter": "Géométrie"},
        ]
        client = make_supabase(exercise_attempts=attempts, exercises=exercises)
        # Algèbre : 2 corrects consécutifs
        assert compute_streak(client, "u1", chapter="Algèbre") == 2

    def test_chapter_filter_no_match_returns_zero(self):
        attempts = [
            {"exercise_id": 10, "is_correct": True, "attempted_at": "2024-01-01T10:00:00"}
        ]
        exercises = [{"id": 10, "chapter": "Géométrie"}]
        client = make_supabase(exercise_attempts=attempts, exercises=exercises)
        assert compute_streak(client, "u1", chapter="Algèbre") == 0

    def test_chapter_filter_negative_streak(self):
        """Filtre chapitre : série de mauvaises réponses → streak négatif."""
        attempts = [
            {"exercise_id": 10, "is_correct": False, "attempted_at": "2024-01-02T10:00:00"},
            {"exercise_id": 10, "is_correct": False, "attempted_at": "2024-01-01T10:00:00"},
        ]
        exercises = [{"id": 10, "chapter": "Algèbre"}]
        client = make_supabase(exercise_attempts=attempts, exercises=exercises)
        assert compute_streak(client, "u1", chapter="Algèbre") == -2
