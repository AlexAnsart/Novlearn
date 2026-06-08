/**
 * Tests pour frontend/app/lib/exerciseUtils.ts
 *
 * Couvre :
 *   - DIFFICULTY_DB_TO_UI : mapping DB → UI
 *   - DIFFICULTY_UI_TO_DB : mapping UI → DB
 *   - dbToUiDifficulty    : conversion avec gestion des cas limites
 *   - uiToDbDifficulty    : conversion inverse
 */
import { describe, it, expect } from "vitest";
import {
  DIFFICULTY_DB_TO_UI,
  DIFFICULTY_UI_TO_DB,
  dbToUiDifficulty,
  uiToDbDifficulty,
} from "../../app/lib/exerciseUtils";

// ── Constantes de mapping ─────────────────────────────────────────────────────

describe("DIFFICULTY_DB_TO_UI", () => {
  it("'easy' → 'Facile'", () => expect(DIFFICULTY_DB_TO_UI.easy).toBe("Facile"));
  it("'medium' → 'Moyen'", () => expect(DIFFICULTY_DB_TO_UI.medium).toBe("Moyen"));
  it("'hard' → 'Difficile'", () => expect(DIFFICULTY_DB_TO_UI.hard).toBe("Difficile"));
  it("couvre exactement les 3 niveaux", () => {
    const keys = Object.keys(DIFFICULTY_DB_TO_UI);
    expect(keys).toHaveLength(3);
    expect(keys).toContain("easy");
    expect(keys).toContain("medium");
    expect(keys).toContain("hard");
  });
});

describe("DIFFICULTY_UI_TO_DB", () => {
  it("'Facile' → 'easy'", () => expect(DIFFICULTY_UI_TO_DB.Facile).toBe("easy"));
  it("'Moyen' → 'medium'", () => expect(DIFFICULTY_UI_TO_DB.Moyen).toBe("medium"));
  it("'Difficile' → 'hard'", () => expect(DIFFICULTY_UI_TO_DB.Difficile).toBe("hard"));
  it("est l'inverse exact de DB_TO_UI", () => {
    for (const [db, ui] of Object.entries(DIFFICULTY_DB_TO_UI)) {
      expect(DIFFICULTY_UI_TO_DB[ui as keyof typeof DIFFICULTY_UI_TO_DB]).toBe(db);
    }
  });
});

// ── dbToUiDifficulty ──────────────────────────────────────────────────────────

describe("dbToUiDifficulty", () => {
  // Cas normaux
  it("'easy' → 'Facile'", () => expect(dbToUiDifficulty("easy")).toBe("Facile"));
  it("'medium' → 'Moyen'", () => expect(dbToUiDifficulty("medium")).toBe("Moyen"));
  it("'hard' → 'Difficile'", () => expect(dbToUiDifficulty("hard")).toBe("Difficile"));

  // Valeurs UI déjà en français (pass-through)
  it("'Facile' passthrough → 'Facile'", () => expect(dbToUiDifficulty("Facile")).toBe("Facile"));
  it("'Moyen' passthrough → 'Moyen'", () => expect(dbToUiDifficulty("Moyen")).toBe("Moyen"));
  it("'Difficile' passthrough → 'Difficile'", () =>
    expect(dbToUiDifficulty("Difficile")).toBe("Difficile"));

  // Cas limites
  it("null → null", () => expect(dbToUiDifficulty(null)).toBeNull());
  it("chaîne vide → null", () => expect(dbToUiDifficulty("")).toBeNull());
  it("valeur inconnue → null", () => expect(dbToUiDifficulty("extreme")).toBeNull());
  it("'EASY' (majuscule) → null (sensible à la casse)", () =>
    expect(dbToUiDifficulty("EASY")).toBeNull());
});

// ── uiToDbDifficulty ──────────────────────────────────────────────────────────

describe("uiToDbDifficulty", () => {
  it("'Facile' → 'easy'", () => expect(uiToDbDifficulty("Facile")).toBe("easy"));
  it("'Moyen' → 'medium'", () => expect(uiToDbDifficulty("Moyen")).toBe("medium"));
  it("'Difficile' → 'hard'", () => expect(uiToDbDifficulty("Difficile")).toBe("hard"));

  it("dbToUiDifficulty et uiToDbDifficulty sont inverses", () => {
    const dbValues: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    for (const db of dbValues) {
      const ui = dbToUiDifficulty(db)!;
      expect(uiToDbDifficulty(ui)).toBe(db);
    }
  });
});

// ── Cohérence globale ─────────────────────────────────────────────────────────

describe("Cohérence des mappings", () => {
  it("les 3 niveaux DB couvrent tous les cas", () => {
    const dbLevels = ["easy", "medium", "hard"] as const;
    const uiLevels = ["Facile", "Moyen", "Difficile"] as const;

    dbLevels.forEach((db, i) => {
      expect(dbToUiDifficulty(db)).toBe(uiLevels[i]);
    });
  });

  it("aucune perte d'information dans la conversion aller-retour", () => {
    const testCases: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    testCases.forEach((db) => {
      const ui = DIFFICULTY_DB_TO_UI[db];
      const backToDb = DIFFICULTY_UI_TO_DB[ui];
      expect(backToDb).toBe(db);
    });
  });
});
