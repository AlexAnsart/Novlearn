# Chapter Placement Test – Implementation Brief

## Summary

The chapter placement test has been implemented and integrated with the exercise recommendation flow. New users (or users visiting a chapter for the first time) are evaluated before receiving normal recommendations.

---

## Current vs. Previous Behavior

### Before

- **Recommendation only**: Every visit to `/exercices` without an `id` called `getRecommendedExercise`, which used streak + competence scores.
- **No first-connection handling**: No special logic for new users or first chapter visit.
- **No adaptive assessment**: Scores started at 0, so first exercises were always easy.

### After

- **Placement test first**: If the user has not completed the placement test for the chapter, they get test exercises instead of normal recommendations.
- **Adaptive**: 2 exercises per competence (easy → medium if success, else easy again); up to 3 if both easy and medium succeed.
- **Scoring**: `(difficulty_level + 1) / 10 * max_points` per success (≈0–75% per competence).
- **After completion**: Normal recommendation flow resumes.

---

## Architecture

### Backend

| File | Role |
|------|------|
| `backend/chapter_placement_test.py` | Placement test logic, state, scoring |
| `backend/settings/competence_settings.py` | Competences, `DEFAULT_CHAPTER`, `CHAPTER_DB_ALIASES` |
| `backend/main.py` | `GET /api/recommend-exercise`, `POST /api/chapter-test/next`, `GET /api/chapter-test/status` |

### Database (migration 008)

- `user_chapter_test_completed` – `(user_id, chapter)` when test is done.
- `user_chapter_test_state` – `(user_id, chapter, competence_index, exercise_index, last_success)` for in-progress test.

### Frontend

| File | Changes |
|------|---------|
| `frontend/app/lib/api.ts` | `postChapterTestNext()`, `RecommendExerciseResponse` extended with `mode`, `chapter` |
| `frontend/app/exercices/page.tsx` | Manages `mode`, `testChapter`, `handleNextClick` for test vs. recommendation |
| `frontend/app/components/Exercise/ExerciseLoader.tsx` | Props `mode`, `onNextClick`; badges "Mode test" / "Recommandation"; logging |

---

## Flow

1. User visits `/exercices` (or `/exercices?chapter=X`).
2. `GET /api/recommend-exercise`:
   - If placement test not completed for chapter → return first test exercise (`mode: "test"`).
   - Else → return normal recommendation (`mode: "recommendation"`).
3. While in test mode:
   - User completes exercise.
   - Clicks "Exercice Suivant".
   - Frontend calls `POST /api/chapter-test/next` with `{ chapter, last_success }`.
   - Backend applies scoring, advances state, returns next exercise or `{ completed: true }`.
4. On `completed: true`:
   - Frontend fetches a new recommendation.
   - Normal recommendations resume.

---

## UI

- **Mode test**: Amber badge “Mode test”.
- **Recommandation**: Indigo badge “Recommandation”.
- Info card: “Test de placement : évalue ton niveau…” when in test mode.

---

## Logging

- **Frontend**: `[Exercise]`, `[ExercisePage]`, `[ExerciseLoader]` for mode, chapter, exercise id, next/complete.
- **Backend**: `[ChapterTest]`, `[API]` for start, next, completion, recommendation.

---

## Configuration

- **Chapter names**: Backend uses `"Suites numériques"`; DB exercises may use `"Suites et limites"` → `CHAPTER_DB_ALIASES` handles both.
- **Competences**: See `backend/settings/competence_settings.py`; max 10 competences per test.
- **Default chapter**: First chapter in `COMPETENCES` when no chapter is provided.

---

## Migration

```bash
# Apply migration (Supabase or psql)
psql -f supabase/migrations/008_chapter_test_completed.sql
# Or via Supabase CLI: supabase db push
```

---

## Notes

- Points in test mode are written by the backend only; frontend does not call `updateCompetenceScore` for test exercises.
- Streak is kept when updating scores; only `points` is changed during the test.
- Placement test is per chapter; completion is tracked in `user_chapter_test_completed`.
- **Chapter names**: Ensure `exercises.chapter` matches backend competences. `CHAPTER_DB_ALIASES` maps "Suites numériques" to ["Suites numériques", "Suites et limites"] for the placement test. The normal recommender still uses exact match.
