/**
 * Tests pour duel-server/src/rooms/schema/DuelState.ts
 * et la logique de jeu (config + transitions d'état).
 *
 * Couvre :
 *   - DuelState : valeurs par défaut du schéma
 *   - DuelState : mutations de propriétés
 *   - config.ts : constantes de configuration
 *   - Logique de détermination du gagnant (mirroir de finishDuel)
 *   - Logique de score (mirroir de handleSubmitAnswer)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { DuelState } from "../rooms/schema/DuelState";
import {
  CORRECTION_DISPLAY_SECONDS,
  DUEL_DURATION_SECONDS,
  EXERCISE_TIMEOUT_SECONDS,
} from "../config";

// ── DuelState : valeurs initiales ─────────────────────────────────────────────

describe("DuelState — valeurs par défaut", () => {
  let state: DuelState;

  beforeEach(() => {
    state = new DuelState();
  });

  it("phase initiale = 'waiting'", () => {
    expect(state.phase).toBe("waiting");
  });

  it("scores initiaux = 0", () => {
    expect(state.player1Score).toBe(0);
    expect(state.player2Score).toBe(0);
  });

  it("identifiants joueurs vides par défaut", () => {
    expect(state.player1Id).toBe("");
    expect(state.player2Id).toBe("");
  });

  it("noms joueurs vides par défaut", () => {
    expect(state.player1Name).toBe("");
    expect(state.player2Name).toBe("");
  });

  it("winnerId vide par défaut (signifie match nul ou partie non terminée)", () => {
    expect(state.winnerId).toBe("");
  });

  it("timestamps initiaux = 0", () => {
    expect(state.duelStartedAt).toBe(0);
    expect(state.exerciseStartedAt).toBe(0);
  });

  it("duelDurationSeconds a une valeur par défaut positive", () => {
    // La valeur par défaut du schéma (300) est remplacée par DUEL_DURATION_SECONDS
    // lors de DuelRoom.onCreate(). On vérifie seulement qu'elle est > 0.
    expect(state.duelDurationSeconds).toBeGreaterThan(0);
  });

  it("exerciseTimeoutSeconds a une valeur par défaut positive", () => {
    expect(state.exerciseTimeoutSeconds).toBeGreaterThan(0);
  });

  it("correctionDisplaySeconds a une valeur par défaut positive", () => {
    expect(state.correctionDisplaySeconds).toBeGreaterThan(0);
  });
});

// ── DuelState : mutations ─────────────────────────────────────────────────────

describe("DuelState — mutations de propriétés", () => {
  it("passe à la phase 'playing'", () => {
    const state = new DuelState();
    state.phase = "playing";
    expect(state.phase).toBe("playing");
  });

  it("passe à la phase 'finished'", () => {
    const state = new DuelState();
    state.phase = "finished";
    expect(state.phase).toBe("finished");
  });

  it("incrémente player1Score", () => {
    const state = new DuelState();
    state.player1Score++;
    expect(state.player1Score).toBe(1);
  });

  it("incrémente player2Score", () => {
    const state = new DuelState();
    state.player2Score++;
    expect(state.player2Score).toBe(1);
  });

  it("enregistre les ids et noms de joueurs", () => {
    const state = new DuelState();
    state.player1Id = "uid-alice";
    state.player2Id = "uid-bob";
    state.player1Name = "Alice";
    state.player2Name = "Bob";

    expect(state.player1Id).toBe("uid-alice");
    expect(state.player2Id).toBe("uid-bob");
    expect(state.player1Name).toBe("Alice");
    expect(state.player2Name).toBe("Bob");
  });

  it("enregistre le gagnant", () => {
    const state = new DuelState();
    state.player1Id = "uid-winner";
    state.winnerId = state.player1Id;
    expect(state.winnerId).toBe("uid-winner");
  });
});

// ── Logique de configuration ──────────────────────────────────────────────────

describe("Configuration du duel", () => {
  it("DUEL_DURATION_SECONDS est positif et raisonnable", () => {
    expect(DUEL_DURATION_SECONDS).toBeGreaterThan(0);
    expect(DUEL_DURATION_SECONDS).toBeLessThanOrEqual(600); // max 10 min
  });

  it("EXERCISE_TIMEOUT_SECONDS est positif et inférieur à la durée du duel", () => {
    expect(EXERCISE_TIMEOUT_SECONDS).toBeGreaterThan(0);
    expect(EXERCISE_TIMEOUT_SECONDS).toBeLessThan(DUEL_DURATION_SECONDS);
  });

  it("CORRECTION_DISPLAY_SECONDS est positif", () => {
    expect(CORRECTION_DISPLAY_SECONDS).toBeGreaterThan(0);
  });
});

// ── Logique de fin de duel (mirroir de finishDuel) ────────────────────────────

describe("Logique de détermination du gagnant", () => {
  /**
   * On reproduit ici la logique de DuelRoom.finishDuel() pour la tester en isolation.
   * La règle : p1 > p2 → player1Id gagne ; p2 > p1 → player2Id gagne ; sinon match nul.
   */
  function determineWinner(
    p1Score: number,
    p2Score: number,
    player1Id: string,
    player2Id: string,
  ): string {
    if (p1Score > p2Score) return player1Id;
    if (p2Score > p1Score) return player2Id;
    return ""; // match nul
  }

  it("player1 gagne si son score est plus élevé", () => {
    expect(determineWinner(5, 3, "p1", "p2")).toBe("p1");
  });

  it("player2 gagne si son score est plus élevé", () => {
    expect(determineWinner(2, 7, "p1", "p2")).toBe("p2");
  });

  it("match nul si scores égaux → winnerId vide", () => {
    expect(determineWinner(4, 4, "p1", "p2")).toBe("");
  });

  it("player1 gagne avec un seul point d'avance", () => {
    expect(determineWinner(1, 0, "p1", "p2")).toBe("p1");
  });

  it("match nul à 0-0", () => {
    expect(determineWinner(0, 0, "p1", "p2")).toBe("");
  });
});

// ── Logique de score (mirroir de handleSubmitAnswer) ─────────────────────────

describe("Logique de score", () => {
  /**
   * Reproduction de la logique de score de DuelRoom.handleSubmitAnswer().
   * Un joueur ne peut marquer qu'une fois par exercice.
   */
  function applyScore(
    state: { player1Score: number; player2Score: number },
    playerId: string,
    player1Id: string,
    solvedPlayers: Set<string>,
    isCorrect: boolean,
  ): { scored: boolean; isFirstSolver: boolean } {
    if (!isCorrect) return { scored: false, isFirstSolver: false };
    if (solvedPlayers.has(playerId)) return { scored: false, isFirstSolver: false };

    solvedPlayers.add(playerId);
    const isFirstSolver = solvedPlayers.size === 1;
    if (playerId === player1Id) state.player1Score++;
    else state.player2Score++;

    return { scored: true, isFirstSolver };
  }

  it("réponse correcte de player1 incrémente son score", () => {
    const state = { player1Score: 0, player2Score: 0 };
    const solved = new Set<string>();
    const { scored } = applyScore(state, "p1", "p1", solved, true);
    expect(scored).toBe(true);
    expect(state.player1Score).toBe(1);
    expect(state.player2Score).toBe(0);
  });

  it("réponse correcte de player2 incrémente son score", () => {
    const state = { player1Score: 0, player2Score: 0 };
    const solved = new Set<string>();
    const { scored } = applyScore(state, "p2", "p1", solved, true);
    expect(scored).toBe(true);
    expect(state.player2Score).toBe(1);
    expect(state.player1Score).toBe(0);
  });

  it("réponse incorrecte ne modifie pas le score", () => {
    const state = { player1Score: 2, player2Score: 1 };
    const solved = new Set<string>();
    const { scored } = applyScore(state, "p1", "p1", solved, false);
    expect(scored).toBe(false);
    expect(state.player1Score).toBe(2);
  });

  it("un joueur ne peut marquer qu'une fois par exercice", () => {
    const state = { player1Score: 0, player2Score: 0 };
    const solved = new Set<string>(["p1"]); // déjà marqué
    const { scored } = applyScore(state, "p1", "p1", solved, true);
    expect(scored).toBe(false);
    expect(state.player1Score).toBe(0);
  });

  it("isFirstSolver = true pour le premier joueur qui résout", () => {
    const state = { player1Score: 0, player2Score: 0 };
    const solved = new Set<string>();
    const { isFirstSolver } = applyScore(state, "p1", "p1", solved, true);
    expect(isFirstSolver).toBe(true);
  });

  it("isFirstSolver = false pour le second joueur", () => {
    const state = { player1Score: 0, player2Score: 0 };
    const solved = new Set<string>(["p1"]); // p1 a déjà résolu
    const { isFirstSolver } = applyScore(state, "p2", "p1", solved, true);
    expect(isFirstSolver).toBe(false);
  });
});

// ── Logique de skip (mirroir de handleSkipRequest) ───────────────────────────

describe("Logique de skip", () => {
  /**
   * Reproduction de la logique de handleSkipRequest().
   * Les deux joueurs doivent demander le skip pour passer à l'exercice suivant.
   */
  function handleSkip(
    skipRequests: Set<string>,
    solvedPlayers: Set<string>,
    playerId: string,
  ): { skipped: boolean; proposed: boolean } {
    if (solvedPlayers.size > 0) return { skipped: false, proposed: false }; // déjà résolu
    if (skipRequests.has(playerId)) return { skipped: false, proposed: false }; // déjà demandé

    skipRequests.add(playerId);
    if (skipRequests.size >= 2) {
      skipRequests.clear();
      return { skipped: true, proposed: true };
    }
    return { skipped: false, proposed: true };
  }

  it("un seul skip ne passe pas à l'exercice suivant", () => {
    const skips = new Set<string>();
    const solved = new Set<string>();
    const { skipped } = handleSkip(skips, solved, "p1");
    expect(skipped).toBe(false);
  });

  it("deux skips passent à l'exercice suivant", () => {
    const skips = new Set<string>();
    const solved = new Set<string>();
    handleSkip(skips, solved, "p1");
    const { skipped } = handleSkip(skips, solved, "p2");
    expect(skipped).toBe(true);
  });

  it("skip ignoré si exercice déjà résolu", () => {
    const skips = new Set<string>();
    const solved = new Set<string>(["p1"]);
    const { proposed } = handleSkip(skips, solved, "p2");
    expect(proposed).toBe(false);
  });

  it("un joueur ne peut demander le skip qu'une seule fois", () => {
    const skips = new Set<string>(["p1"]);
    const solved = new Set<string>();
    const { proposed } = handleSkip(skips, solved, "p1");
    expect(proposed).toBe(false);
  });
});
