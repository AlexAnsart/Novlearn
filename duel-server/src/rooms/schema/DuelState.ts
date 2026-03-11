import { Schema, type } from "@colyseus/schema";

export class DuelState extends Schema {
  /** "waiting" → both players not yet connected; "playing" → game running; "finished" → over */
  @type("string") phase: string = "waiting";

  @type("uint8") player1Score: number = 0;
  @type("uint8") player2Score: number = 0;

  @type("string") player1Id: string = "";
  @type("string") player2Id: string = "";
  @type("string") player1Name: string = "";
  @type("string") player2Name: string = "";

  /** Empty string = draw */
  @type("string") winnerId: string = "";

  /** Unix timestamp (seconds) when the duel started — used for global countdown */
  @type("uint32") duelStartedAt: number = 0;

  /** Unix timestamp (seconds) when the current exercise was presented */
  @type("uint32") exerciseStartedAt: number = 0;

  /** Duration constants pushed to clients so they stay in sync with server config */
  @type("uint16") duelDurationSeconds: number = 300;
  @type("uint16") exerciseTimeoutSeconds: number = 45;
  @type("uint8")  correctionDisplaySeconds: number = 5;
}
