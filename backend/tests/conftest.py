"""
Fixtures pytest partagées pour les tests backend Novlearn.
La logique de mock Supabase est dans helpers.py (importable directement).
"""
import pytest
from helpers import make_supabase


@pytest.fixture
def make_sb():
    """Fixture exposant make_supabase() pour les tests qui préfèrent les fixtures."""
    return make_supabase
