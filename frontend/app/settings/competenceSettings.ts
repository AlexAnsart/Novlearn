/**
 * Competences and chapter order: single source of truth (no Supabase migrations to maintain).
 * - Barèmes (max_points), noms, chapitres : COMPETENCES
 * - Ordre d'affichage : CHAPTER_ORDER
 * - Lien exercice → compétence : colonne exercises.competence_id en DB
 */

export interface CompetenceConfig {
  id: string;
  name: string;
  chapter: string;
  max_points: number;
}

export const CHAPTER_ORDER: string[] = [
  "Suites et limites",
  "Limites et continuité",
  "Fonctions",
  "Dérivabilité",
  "Logarithme néperien",
  "Primitives et équadiff",
  "Convexité",
  "Stats",
  "Probas",
];

/** Competences: id, nom affiché, chapitre, barème (max points). Modifier ici, pas en DB. */
export const COMPETENCES: CompetenceConfig[] = [
  { id: "limites_de_suites_usuelles", name: "Limites de suites usuelles", chapter: "Suites et limites", max_points: 10 },
  { id: "somme_des_termes_d_une_suite", name: "Somme des termes d'une suite", chapter: "Suites et limites", max_points: 20 },
  { id: "suites_croissantes_decroissantes", name: "Suites croissantes / décroissantes", chapter: "Suites et limites", max_points: 15 },
];

const byId = new Map<string, CompetenceConfig>(COMPETENCES.map((c) => [c.id, c]));

export function getCompetenceById(id: string): CompetenceConfig | undefined {
  return byId.get(id);
}
