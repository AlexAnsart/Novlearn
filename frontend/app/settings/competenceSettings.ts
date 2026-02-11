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
  "Suites numériques",
  "Limites et continuité",
  "Dérivation et Fonctions",
  "Logarithme néperien",
  "Primitives et équadiff",
  "Convexité",
  "Stats",
  "Probas",
];

/** Competences: id, nom affiché, chapitre, barème (max points). Modifier ici, pas en DB. */
export const COMPETENCES: CompetenceConfig[] = [
  // --- Suites numériques ---
  {
    id: "definir_une_suite",
    name: "Définir une suite",
    chapter: "Suites numériques",
    max_points: 40,
  },
  {
    id: "calculer_des_termes",
    name: "Calculer des termes",
    chapter: "Suites numériques",
    max_points: 30,
  },
  {
    id: "etudier_variations_suite",
    name: "Étudier les variations (croissance/décroissance)",
    chapter: "Suites numériques",
    max_points: 70,
  },
  {
    id: "determiner_une_limite_suite",
    name: "Déterminer une limite",
    chapter: "Suites numériques",
    max_points: 80,
  },
  {
    id: "reconnaitre_suites_arith_geo",
    name: "Reconnaître des suites arithmétiques/géométriques",
    chapter: "Suites numériques",
    max_points: 30,
  },
  {
    id: "modeliser_situation_suite",
    name: "Modéliser une situation par une suite",
    chapter: "Suites numériques",
    max_points: 30,
  },
  {
    id: "interpreter_graphiquement_suite",
    name: "Interpréter graphiquement une suite",
    chapter: "Suites numériques",
    max_points: 20,
  },

  // --- Limites et continuité ---
  {
    id: "savoir_si_fonction_continue",
    name: "Savoir si une fonction est continue",
    chapter: "Limites et continuité",
    max_points: 30,
  },
  {
    id: "calculer_limite_point",
    name: "Calculer une limite en un point",
    chapter: "Limites et continuité",
    max_points: 40,
  },
  {
    id: "identifier_asymptote",
    name: "Identifier une asymptote horizontale/verticale",
    chapter: "Limites et continuité",
    max_points: 30,
  },
  {
    id: "utiliser_limites_usuelles",
    name: "Utiliser les limites usuelles",
    chapter: "Limites et continuité",
    max_points: 50,
  },
  {
    id: "dresser_tableau_signes_variations",
    name: "Dresser un tableau de signes et variations",
    chapter: "Limites et continuité",
    max_points: 80,
  },
  {
    id: "determiner_max_min",
    name: "Déterminer des maximums et minimums",
    chapter: "Limites et continuité",
    max_points: 70,
  },
];

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
 * Returns the ID if it's already an ID, or converts name to ID if it's a name.
 */
export function normalizeCompetenceId(identifier: string): string | null {
  // First check if it's already an ID
  if (byId.has(identifier)) {
    return identifier;
  }
  // Then check if it's a name
  const competence = byName.get(identifier);
  if (competence) {
    return competence.id;
  }
  // If neither, return null
  console.warn(`[normalizeCompetenceId] Unknown competence identifier: "${identifier}"`);
  return null;
}
