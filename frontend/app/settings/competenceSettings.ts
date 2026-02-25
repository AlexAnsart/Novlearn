/**
 * Competences and chapter order: loaded from shared/competences.json (single source of truth).
 * Both backend and frontend use this file.
 */

import competencesData from "../../../shared/competences.json";

export interface CompetenceConfig {
  id: string;
  name: string;
  chapter: string;
  max_points: number;
}

export const CHAPTER_ORDER: string[] = competencesData.chapterOrder;
export const COMPETENCES: CompetenceConfig[] = competencesData.competences;

const byId = new Map<string, CompetenceConfig>(
  COMPETENCES.map((c) => [c.id, c]),
);

const byName = new Map<string, CompetenceConfig>(
  COMPETENCES.map((c) => [c.name, c]),
);

export function getCompetenceById(id: string): CompetenceConfig | undefined {
  return byId.get(id);
}

export function getCompetenceByName(name: string): CompetenceConfig | undefined {
  return byName.get(name);
}

/**
 * Convert competence identifier (ID or name) to ID.
 */
export function normalizeCompetenceId(identifier: string): string | null {
  if (byId.has(identifier)) return identifier;
  const competence = byName.get(identifier);
  return competence ? competence.id : null;
}
