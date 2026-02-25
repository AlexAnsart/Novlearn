"""
Competence metadata loaded from shared/competences.json (single source of truth).
Both backend and frontend use this file.
"""
import json
from pathlib import Path

# Path to shared config (backend/settings/ -> project root -> shared/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_COMPETENCES_PATH = _PROJECT_ROOT / "shared" / "competences.json"

with open(_COMPETENCES_PATH, encoding="utf-8") as f:
    _DATA = json.load(f)

COMPETENCES = _DATA["competences"]
CHAPTER_ORDER = _DATA["chapterOrder"]
CHAPTER_DB_ALIASES: dict[str, list[str]] = _DATA.get("chapterDbAliases", {})

DEFAULT_CHAPTER = CHAPTER_ORDER[0] if CHAPTER_ORDER else "Suites numériques"


def get_competences(chapter: str | None = None) -> dict[str, int]:
    """Return {competence_id: max_points}. If chapter is set, filter by chapter."""
    out = {}
    for c in COMPETENCES:
        if chapter is None or c["chapter"] == chapter:
            out[c["id"]] = c["max_points"]
    return out


def get_chapters_with_competences() -> list[str]:
    """Return list of chapters that have competences defined."""
    return list(dict.fromkeys(c["chapter"] for c in COMPETENCES))
