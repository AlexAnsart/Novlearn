/**
 * Duel mode configuration. Keep in sync with backend/settings/duel_settings.py.
 */

/** Total duel duration in seconds (e.g. 180 = 3 minutes). */
export const DUEL_DURATION_SECONDS = 180;

/** If neither player scores within this time, next exercise is loaded (seconds). */
export const DUEL_EXERCISE_TIMEOUT_SECONDS = 30;

/** How long to show the correction when moving to next exercise without solving (seconds). */
export const DUEL_CORRECTION_DISPLAY_SECONDS = 5;
