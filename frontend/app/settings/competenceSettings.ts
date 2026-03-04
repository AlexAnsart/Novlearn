/**
 * @deprecated Utiliser useTaxonomyStore depuis "../store/useTaxonomyStore".
 * Ce fichier est un shim de compatibilité : les fonctions synchrones
 * lisent directement l'état Zustand (disponible après le chargement initial).
 */
export type { CompetenceConfig } from "../services/taxonomyService";
export { useTaxonomyStore } from "../store/useTaxonomyStore";

import type { CompetenceConfig } from "../services/taxonomyService";
import { useTaxonomyStore } from "../store/useTaxonomyStore";

/** Accès synchrone à l'état du store (fonctionne en dehors des composants React) */
export function getCompetenceById(id: string): CompetenceConfig | undefined {
  return useTaxonomyStore.getState().getCompetenceById(id);
}

export function getCompetenceByName(
  name: string,
): CompetenceConfig | undefined {
  return useTaxonomyStore.getState().getCompetenceByName(name);
}

export function normalizeCompetenceId(identifier: string): string | null {
  return useTaxonomyStore.getState().normalizeCompetenceId(identifier);
}
