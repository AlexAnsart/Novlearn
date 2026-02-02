"""
Calcul du streak (série de succès ou d'échecs) à partir des exercise_attempts.
Par chapitre : uniquement les tentatives sur des exercices du chapitre.
Sans chapitre : toutes les tentatives (global).
Retourne un entier signé : > 0 = série de bonnes réponses, < 0 = série de mauvaises.
"""
from typing import Any

from settings.recommandation_settings import GLOBAL_STREAK_WINDOW


def compute_streak(
    supabase_client: Any,
    user_id: str,
    chapter: str | None = None,
    window: int | None = None,
) -> int:
    """
    Streak sur les N dernières tentatives (ordre attempted_at desc).
    Si chapter est fourni : uniquement les tentatives sur des exercices de ce chapitre.
    Sinon : toutes les tentatives (global).
    Positif = bonnes réponses consécutives depuis la dernière ;
    négatif = - (mauvaises consécutives).
    """
    limit = window if window is not None else GLOBAL_STREAK_WINDOW
    if limit <= 0:
        return 0

    # Récupérer assez de tentatives pour avoir potentiellement `window` dans le chapitre
    fetch_limit = limit * 3 if chapter else limit
    result = (
        supabase_client.table("exercise_attempts")
        .select("exercise_id, is_correct, attempted_at")
        .eq("user_id", user_id)
        .order("attempted_at", desc=True)
        .limit(fetch_limit)
        .execute()
    )
    rows = result.data or []
    if not rows:
        return 0

    if chapter:
        exercise_ids = list({r["exercise_id"] for r in rows if r.get("exercise_id")})
        if not exercise_ids:
            return 0
        # Chunk si trop d'ids pour la requête (ex. 100 max)
        chunk_size = 100
        id_to_chapter: dict[int | str, str] = {}
        for i in range(0, len(exercise_ids), chunk_size):
            chunk = exercise_ids[i : i + chunk_size]
            ex_result = (
                supabase_client.table("exercises")
                .select("id, chapter")
                .in_("id", chunk)
                .execute()
            )
            for ex in ex_result.data or []:
                id_to_chapter[ex["id"]] = (ex.get("chapter") or "").strip()
        # Garder les tentatives dont l'exercice est dans le chapitre
        rows = [r for r in rows if id_to_chapter.get(r.get("exercise_id")) == chapter]
        rows = rows[:limit]

    if not rows:
        return 0

    first_correct = rows[0].get("is_correct")
    count = 0
    for r in rows:
        if r.get("is_correct") == first_correct:
            count += 1
        else:
            break
    return count if first_correct else -count
