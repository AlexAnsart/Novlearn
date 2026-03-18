"""
Duel mode configuration: session duration and per-exercise timeout.
"""

# Total duel duration in seconds (e.g. 180 = 3 minutes)
# NOTE: Game logic now lives in the Colyseus duel-server. Keep this value
# aligned with `duel-server/src/config.ts` and `frontend/app/settings/duelSettings.ts`.
DUEL_DURATION_SECONDS = 180

# If neither player scores within this time, move to next exercise (seconds)
DUEL_EXERCISE_TIMEOUT_SECONDS = 45

# How long to show the correction when moving to next exercise without solving (seconds)
DUEL_CORRECTION_DISPLAY_SECONDS = 5
