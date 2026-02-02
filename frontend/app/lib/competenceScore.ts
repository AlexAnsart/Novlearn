/**
 * Competence score calculation.
 * Score only increments, never decrements (to avoid stressing the student).
 */

/** difficulty_level: 0 = easy, 1 = medium, 2 = hard */
export function getBonusStreak(streak: number): number {
  if (streak < 1) return 0;
  if (streak < 3) return 1;
  if (streak < 5) return 2;
  return 3;
}

/**
 * Returns new points for the competence (capped at max_points).
 * Points to add = difficulty_level + 1 + bonus_streak.
 */
export function computeNewScore(
  currentPoints: number,
  maxPoints: number,
  difficultyLevel: number,
  streak: number
): number {
  const bonusStreak = getBonusStreak(streak);
  const pointsToAdd = difficultyLevel + 1 + bonusStreak;
  const candidate = currentPoints + pointsToAdd;
  return Math.min(candidate, maxPoints);
}

/** Map DB difficulty to level 0, 1, 2 for the algo */
export function difficultyToLevel(difficulty: string | null): number {
  if (!difficulty) return 0;
  const d = difficulty.toLowerCase();
  if (d === "easy" || d === "facile") return 0;
  if (d === "medium" || d === "moyen") return 1;
  if (d === "hard" || d === "difficile") return 2;
  return 0;
}
