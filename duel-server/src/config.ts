/** Duel configuration — single source of truth for the game server. */

/**
 * Total duel duration in seconds.
 * Kept in sync with `frontend/app/settings/duelSettings.ts` and
 * `backend/settings/duel_settings.py`.
 *
 * 180s = 3 minutes.
 */
export const DUEL_DURATION_SECONDS = 180;

/**
 * Per‑exercise timeout in seconds.
 * When reached with no point scored, the exercise times out.
 */
export const EXERCISE_TIMEOUT_SECONDS = 45;

/** How long to show the correction on timeout (seconds). */
export const CORRECTION_DISPLAY_SECONDS = 5;
