-- Scale up competences that had max_points=10 (too low: reachable in 2-3 hard exercises).
-- New minimum: 30 points. Existing user scores scaled proportionally (×3).
UPDATE user_competence_scores
SET points = LEAST(points * 3, 30)
WHERE competence_id IN (
  SELECT id FROM competences WHERE max_points = 10
);

UPDATE competences SET max_points = 30 WHERE max_points = 10;
