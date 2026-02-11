/**
 * Exercise helpers: difficulty mapping between DB (Supabase) and UI.
 * DB schema (001_initial_schema.sql): difficulty IN ('easy', 'medium', 'hard').
 */

export type DifficultyDb = "easy" | "medium" | "hard";
export type DifficultyUi = "Facile" | "Moyen" | "Difficile";

export const DIFFICULTY_DB_TO_UI: Record<DifficultyDb, DifficultyUi> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
};

export const DIFFICULTY_UI_TO_DB: Record<DifficultyUi, DifficultyDb> = {
  Facile: "easy",
  Moyen: "medium",
  Difficile: "hard",
};

export function dbToUiDifficulty(db: string | null): DifficultyUi | null {
  if (!db) return null;
  if (db in DIFFICULTY_DB_TO_UI) return DIFFICULTY_DB_TO_UI[db as DifficultyDb];
  if (db === "Facile" || db === "Moyen" || db === "Difficile")
    return db as DifficultyUi;
  return null;
}

export function uiToDbDifficulty(ui: DifficultyUi): DifficultyDb {
  return DIFFICULTY_UI_TO_DB[ui];
}

export interface ExerciseListItem {
  id: number;
  title: string | null;
  chapter: string;
  difficulty: string;
}
