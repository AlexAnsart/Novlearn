import { Room, Client } from "colyseus";
import { DuelState } from "./schema/DuelState";
import {
  verifySupabaseToken,
  getDuel,
  getPlayerName,
  getRandomExercise,
  saveDuelResult,
  recordAttempt,
  ExerciseRow,
} from "../db";
import {
  DUEL_DURATION_SECONDS,
  EXERCISE_TIMEOUT_SECONDS,
  CORRECTION_DISPLAY_SECONDS,
} from "../config";

interface SubmitAnswerMsg {
  elementId: number;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface PlayerAuth {
  userId: string;
  name: string;
}

export class DuelRoom extends Room {
  state = new DuelState();

  private get s(): DuelState { return this.state as DuelState; }

  private duelId!: number;
  private currentExercise: ExerciseRow | null = null;
  private currentVariables: Record<string, number> = {};
  private currentExerciseSolvedBy: string | null = null;
  private readyPlayers = new Set<string>();
  private gameStarted = false;
  private duelTimer: ReturnType<typeof setTimeout> | null = null;
  private exerciseTimer: ReturnType<typeof setTimeout> | null = null;

  async onAuth(client: Client, options: { token: string; duelId: number }) {
    const { userId } = await verifySupabaseToken(options.token);
    const duel = await getDuel(options.duelId);
    if (duel.player1_id !== userId && duel.player2_id !== userId) {
      throw new Error("You are not a player of this duel");
    }
    if (duel.status !== "active") {
      throw new Error("Duel is not active yet");
    }
    const name = await getPlayerName(userId);
    console.log("[DuelRoom] onAuth OK", { userId: userId.slice(0, 8), name });
    return { userId, name } satisfies PlayerAuth;
  }

  async onCreate(options: { duelId: number }) {
    console.log("[DuelRoom] onCreate", { duelId: options.duelId });
    this.duelId = options.duelId;
    this.maxClients = 2;

    this.s.duelDurationSeconds = DUEL_DURATION_SECONDS;
    this.s.exerciseTimeoutSeconds = EXERCISE_TIMEOUT_SECONDS;
    this.s.correctionDisplaySeconds = CORRECTION_DISPLAY_SECONDS;

    const duel = await getDuel(this.duelId);
    this.s.player1Id = duel.player1_id;
    this.s.player2Id = duel.player2_id;

    const [name1, name2] = await Promise.all([
      getPlayerName(duel.player1_id),
      getPlayerName(duel.player2_id),
    ]);
    this.s.player1Name = name1;
    this.s.player2Name = name2;

    await this.loadNextExercise();

    this.onMessage("ready", (client: Client) => {
      const auth = client.userData as PlayerAuth;
      console.log("[DuelRoom] ready from", auth.userId.slice(0, 8));
      this.readyPlayers.add(auth.userId);
      this.tryStartGame();
    });

    this.onMessage("submitAnswer", (client: Client, msg: SubmitAnswerMsg) => {
      this.handleSubmitAnswer(client, msg).catch((err) =>
        console.error("[DuelRoom] submitAnswer error:", err),
      );
    });
  }

  onJoin(client: Client, _options: unknown, auth: PlayerAuth) {
    client.userData = auth;
    console.log("[DuelRoom] onJoin", {
      userId: auth.userId.slice(0, 8),
      name: auth.name,
      clients: this.clients.length,
    });
  }

  async onLeave(client: Client, _code?: number) {
    const auth = client.userData as PlayerAuth | undefined;
    console.log("[DuelRoom] onLeave", { userId: auth?.userId.slice(0, 8), code: _code });
    if (this.s.phase === "finished") return;
    try {
      await this.allowReconnection(client, 60);
      console.log("[DuelRoom] reconnected", { userId: auth?.userId.slice(0, 8) });
    } catch {
      console.log("[DuelRoom] reconnection timeout", { userId: auth?.userId.slice(0, 8) });
    }
  }

  onDispose() {
    console.log("[DuelRoom] onDispose", { duelId: this.duelId });
    this.clearAllTimers();
  }

  // ─── Game flow ─────────────────────────────────────────────────────────────

  private tryStartGame() {
    if (this.gameStarted) return;
    if (this.readyPlayers.size < 2) return;
    this.gameStarted = true;

    console.log("[DuelRoom] startGame", { duelId: this.duelId });

    const now = Math.floor(Date.now() / 1000);
    this.s.phase = "playing";
    this.s.duelStartedAt = now;
    this.s.exerciseStartedAt = now;

    this.broadcastExercise();

    this.duelTimer = setTimeout(() => this.finishDuel(), DUEL_DURATION_SECONDS * 1000);
    this.startExerciseTimer();
  }

  private startExerciseTimer() {
    this.clearExerciseTimer();
    this.exerciseTimer = setTimeout(async () => {
      if (this.s.phase !== "playing") return;
      console.log("[DuelRoom] exercise timeout", { duelId: this.duelId });

      this.broadcast("exercise_timeout", {
        correctAnswer: this.getCorrectAnswerPayload(),
      });

      await this.advanceToNextExercise();
    }, EXERCISE_TIMEOUT_SECONDS * 1000);
  }

  private async advanceToNextExercise() {
    await this.loadNextExercise();
    this.s.exerciseStartedAt = Math.floor(Date.now() / 1000);
    this.broadcastExercise();
    this.startExerciseTimer();
  }

  private async handleSubmitAnswer(client: Client, msg: SubmitAnswerMsg) {
    if (this.s.phase !== "playing") return;
    const auth = client.userData as PlayerAuth;

    console.log("[DuelRoom] submitAnswer", {
      userId: auth.userId.slice(0, 8),
      elementId: msg.elementId,
      isCorrect: msg.isCorrect,
    });

    recordAttempt(
      this.duelId, auth.userId, msg.elementId, msg.answer, msg.isCorrect, msg.timeSpent,
    ).catch((err) => console.error("[DuelRoom] recordAttempt failed:", err));

    if (!msg.isCorrect) return;
    if (this.currentExerciseSolvedBy !== null) return;

    this.currentExerciseSolvedBy = auth.userId;
    const isP1 = auth.userId === this.s.player1Id;
    if (isP1) this.s.player1Score++;
    else this.s.player2Score++;

    console.log("[DuelRoom] point scored", {
      userId: auth.userId.slice(0, 8),
      p1Score: this.s.player1Score,
      p2Score: this.s.player2Score,
    });

    this.broadcast("point_scored", { scoredBy: auth.userId });

    this.clearExerciseTimer();
    await this.advanceToNextExercise();
  }

  private finishDuel() {
    if (this.s.phase === "finished") return;
    console.log("[DuelRoom] finishDuel", {
      duelId: this.duelId,
      p1: this.s.player1Score,
      p2: this.s.player2Score,
    });
    this.clearAllTimers();
    this.s.phase = "finished";

    const p1 = this.s.player1Score;
    const p2 = this.s.player2Score;
    if (p1 > p2) this.s.winnerId = this.s.player1Id;
    else if (p2 > p1) this.s.winnerId = this.s.player2Id;

    saveDuelResult(this.duelId, p1, p2, this.s.winnerId || null)
      .catch((err) => console.error("[DuelRoom] saveDuelResult failed:", err));
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async loadNextExercise() {
    const { row, variables } = await getRandomExercise();
    this.currentExercise = row;
    this.currentVariables = variables;
    this.currentExerciseSolvedBy = null;
    console.log("[DuelRoom] loadNextExercise", { id: row.id, title: row.title });
  }

  private broadcastExercise() {
    if (!this.currentExercise) return;
    this.broadcast("exercise", {
      exercise: this.currentExercise,
      variables: this.currentVariables,
    });
  }

  private getCorrectAnswerPayload(): { expression: string; elementId: number } | null {
    if (!this.currentExercise) return null;
    const qEl = this.currentExercise.content?.elements?.find((el) => el.type === "question");
    if (!qEl) return null;
    const content = qEl.content as { answer?: string; correctAnswer?: string };
    return {
      expression: content.answer ?? content.correctAnswer ?? "",
      elementId: qEl.id,
    };
  }

  private clearExerciseTimer() {
    if (this.exerciseTimer) { clearTimeout(this.exerciseTimer); this.exerciseTimer = null; }
  }

  private clearAllTimers() {
    this.clearExerciseTimer();
    if (this.duelTimer) { clearTimeout(this.duelTimer); this.duelTimer = null; }
  }
}
