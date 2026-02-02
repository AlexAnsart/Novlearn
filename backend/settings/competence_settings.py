"""
Competence metadata (id, chapter, max_points). Single source of truth for backend.
Keep in sync with frontend/app/settings/competenceSettings.ts.
"""

COMPETENCES = [
    {"id": "limites_de_suites_usuelles", "chapter": "Suites et limites", "max_points": 10},
    {"id": "somme_des_termes_d_une_suite", "chapter": "Suites et limites", "max_points": 20},
    {"id": "suites_croissantes_decroissantes", "chapter": "Suites et limites", "max_points": 15},
]


def get_competences(chapter: str | None = None) -> dict[str, int]:
    """Return {competence_id: max_points}. If chapter is set, filter by chapter."""
    out = {}
    for c in COMPETENCES:
        if chapter is None or c["chapter"] == chapter:
            out[c["id"]] = c["max_points"]
    return out
