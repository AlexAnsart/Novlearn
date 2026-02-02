"""
Algorithme de recommandation d'exercice selon compétences, points et streak (par chapitre ou global).
Bon streak → exos sur compétences moins maîtrisées ; mauvais streak → remise en confiance.
"""
import random
from typing import Any

from settings.competence_settings import get_competences
from settings.recommandation_settings import (
    STREAK_VERY_LOW,
    STREAK_LOW,
    STREAK_MID,
    CONF_EASY_MAX_VERY_LOW,
    CONF_MEDIUM_MAX_VERY_LOW,
    CONF_EASY_MAX_LOW,
    CONF_MEDIUM_MAX_LOW,
    CONF_EASY_MAX_MID,
    CONF_MEDIUM_MAX_MID,
    CONF_MEDIUM_MAX_HIGH,
    CONF_EASY_MAX_HIGH,
    CONF_MEDIUM_MAX_HIGH,
    DIFFICULTY_BY_LEVEL,
)
from streak import compute_streak


def _tri_fusion_par_ratio(l: list[tuple[str, float]]) -> list[tuple[str, float]]:
    """Tri fusion par valeur du 2e élément (ratio), ordre croissant."""
    if len(l) < 2:
        return l
    m = len(l) // 2
    return _fusion(
        _tri_fusion_par_ratio(l[:m]),
        _tri_fusion_par_ratio(l[m:]),
    )


def _fusion(
    l1: list[tuple[str, float]], l2: list[tuple[str, float]]
) -> list[tuple[str, float]]:
    if not l1:
        return l2
    if not l2:
        return l1
    res, i, j = [], 0, 0
    while i < len(l1) and j < len(l2):
        if l1[i][1] <= l2[j][1]:
            res.append(l1[i])
            i += 1
        else:
            res.append(l2[j])
            j += 1
    res.extend(l1[i:])
    res.extend(l2[j:])
    return res


def _choisir_difficulte(ratio: float, easy_max: float, medium_max: float) -> int:
    """Retourne 0=facile, 1=moyen, 2=difficile selon le ratio de confiance."""
    if ratio < easy_max:
        return 0
    if ratio < medium_max:
        return 1
    return 2


def _pick_exercise_id(ids: list[int]) -> int | None:
    """Index aléatoire dans la liste ; None si vide."""
    if not ids:
        return None
    return random.choice(ids)


def _fallback_random_exercise(
    supabase_client: Any, chapter: str | None = None
) -> dict | None:
    """Un exercice aléatoire avec competence_id non null si possible ; optionnellement filtré par chapitre."""
    q = supabase_client.table("exercises").select("id, competence_id, difficulty, chapter")
    if chapter:
        q = q.eq("chapter", chapter)
    r = q.limit(200).execute()
    data = r.data or []
    data = [e for e in data if e.get("competence_id")] or data
    if not data:
        return None
    ex = random.choice(data)
    level = 0 if ex.get("difficulty") == "easy" else (1 if ex.get("difficulty") == "medium" else 2)
    return {
        "exercise_id": ex["id"],
        "competence_id": ex.get("competence_id"),
        "difficulty_level": level,
        "difficulty": ex.get("difficulty"),
    }


def recommander_exercice(
    supabase_client: Any, user_id: str, chapter: str | None = None
) -> dict | None:
    """
    Recommande un exercice pour l'utilisateur.
    chapter : si fourni, streak et exos/compétences sont limités à ce chapitre.
    Retourne {"exercise_id", "competence_id", "difficulty_level", "difficulty"} ou None.
    """
    # Compétences et max_points (depuis settings, pas la DB)
    competences = get_competences(chapter=chapter)
    if not competences:
        return _fallback_random_exercise(supabase_client, chapter)

    # Points utilisateur (défaut 0)
    r_scores = (
        supabase_client.table("user_competence_scores")
        .select("competence_id, points")
        .eq("user_id", user_id)
        .execute()
    )
    points_eleve = {row["competence_id"]: row["points"] for row in (r_scores.data or [])}
    for cid in competences:
        points_eleve.setdefault(cid, 0)

    # Exercices par compétence et difficulté (optionnellement filtrés par chapitre)
    q_ex = supabase_client.table("exercises").select("id, competence_id, difficulty, chapter")
    if chapter:
        q_ex = q_ex.eq("chapter", chapter)
    r_ex = q_ex.execute()
    exos_par_comp: dict[str, list[list[int]]] = {
        cid: [[], [], []] for cid in competences
    }
    diff_to_idx = {"easy": 0, "medium": 1, "hard": 2}
    for row in r_ex.data or []:
        cid = row.get("competence_id")
        if not cid or cid not in exos_par_comp:
            continue
        idx = diff_to_idx.get(row.get("difficulty"), 0)
        exos_par_comp[cid][idx].append(row["id"])

    # Ne garder que les compétences qui ont au moins un exo
    competences_avec_exos = {
        cid for cid, listes in exos_par_comp.items()
        if any(listes)
    }
    if not competences_avec_exos:
        return _fallback_random_exercise(supabase_client, chapter)

    max_points = competences
    acquises = []
    non_acquises = []
    for cid in competences_avec_exos:
        pts = points_eleve[cid]
        mx = max_points[cid]
        if mx <= 0:
            continue
        if pts >= mx:
            acquises.append((cid, pts))
        else:
            non_acquises.append((cid, pts / mx))

    non_acquises = _tri_fusion_par_ratio(non_acquises)
    n_non = len(non_acquises)
    streak = compute_streak(supabase_client, user_id, chapter=chapter)

    def choisir(
        cid: str, niveau: int
    ) -> tuple[int | None, str | None, int | None]:
        listes = exos_par_comp.get(cid, [[], [], []])
        ids = listes[niveau] if 0 <= niveau < 3 else listes[0]
        if not ids:
            for niv in (0, 1, 2):
                if listes[niv]:
                    return _pick_exercise_id(listes[niv]), cid, niv
            return None, None, None
        return _pick_exercise_id(ids), cid, niveau

    # Streak très bas : remettre en confiance
    if streak < STREAK_VERY_LOW:
        if acquises:
            cid = random.choice(acquises)[0]
            rnd = random.random()
            niv = _choisir_difficulte(rnd, CONF_EASY_MAX_VERY_LOW, CONF_MEDIUM_MAX_VERY_LOW)
            eid, c, lvl = choisir(cid, niv)
            if eid is not None:
                return {
                    "exercise_id": eid,
                    "competence_id": c,
                    "difficulty_level": lvl,
                    "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                }
        else:
            if n_non:
                cid, ratio = non_acquises[n_non - 1]
                niv = _choisir_difficulte(
                    ratio, CONF_EASY_MAX_VERY_LOW, CONF_MEDIUM_MAX_VERY_LOW
                )
                eid, c, lvl = choisir(cid, niv)
                if eid is not None:
                    return {
                        "exercise_id": eid,
                        "competence_id": c,
                        "difficulty_level": lvl,
                        "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                    }

    # Streak bas : confiance légère
    elif streak < STREAK_LOW:
        if not non_acquises:
            if acquises:
                cid = random.choice(acquises)[0]
                rnd = random.random()
                niv = _choisir_difficulte(rnd, CONF_EASY_MAX_LOW, CONF_MEDIUM_MAX_LOW)
                eid, c, lvl = choisir(cid, niv)
                if eid is not None:
                    return {
                        "exercise_id": eid,
                        "competence_id": c,
                        "difficulty_level": lvl,
                        "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                    }
        else:
            cid, ratio = non_acquises[n_non - 1]
            niv = _choisir_difficulte(ratio, CONF_EASY_MAX_LOW, CONF_MEDIUM_MAX_LOW)
            eid, c, lvl = choisir(cid, niv)
            if eid is not None:
                return {
                    "exercise_id": eid,
                    "competence_id": c,
                    "difficulty_level": lvl,
                    "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                }

    # Progression moyenne
    elif streak < STREAK_MID:
        if not non_acquises:
            if acquises:
                cid = random.choice(acquises)[0]
                rnd = random.random()
                niv = _choisir_difficulte(rnd, CONF_EASY_MAX_MID, CONF_MEDIUM_MAX_MID)
                eid, c, lvl = choisir(cid, niv)
                if eid is not None:
                    return {
                        "exercise_id": eid,
                        "competence_id": c,
                        "difficulty_level": lvl,
                        "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                    }
        else:
            cid, ratio = non_acquises[n_non // 2]
            niv = _choisir_difficulte(ratio, CONF_EASY_MAX_LOW, CONF_MEDIUM_MAX_LOW)
            eid, c, lvl = choisir(cid, niv)
            if eid is not None:
                return {
                    "exercise_id": eid,
                    "competence_id": c,
                    "difficulty_level": lvl,
                    "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                }

    # Défi : compétence la plus faible (ou acquises en moyen/difficile)
    else:
        if not non_acquises:
            if acquises:
                cid = random.choice(acquises)[0]
                rnd = random.random()
                niv = 1 if rnd < CONF_MEDIUM_MAX_HIGH else 2
                eid, c, lvl = choisir(cid, niv)
                if eid is not None:
                    return {
                        "exercise_id": eid,
                        "competence_id": c,
                        "difficulty_level": lvl,
                        "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "medium",
                    }
        else:
            cid, ratio = non_acquises[0]
            niv = _choisir_difficulte(ratio, CONF_EASY_MAX_HIGH, CONF_MEDIUM_MAX_HIGH)
            eid, c, lvl = choisir(cid, niv)
            if eid is not None:
                return {
                    "exercise_id": eid,
                    "competence_id": c,
                    "difficulty_level": lvl,
                    "difficulty": DIFFICULTY_BY_LEVEL[lvl] if lvl is not None else "easy",
                }

    return _fallback_random_exercise(supabase_client, chapter)
