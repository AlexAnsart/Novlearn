import { create } from "zustand";
import {
  CompetenceConfig,
  fetchTaxonomyFromDB,
} from "../services/taxonomyService";

interface TaxonomyState {
  isLoaded: boolean;
  chapters: string[];
  chapterEmojis: Record<string, string>;
  competences: CompetenceConfig[];
  competencesByChapter: Record<string, CompetenceConfig[]>;

  loadData: () => Promise<void>;
  getCompetenceById: (id: string) => CompetenceConfig | undefined;
  getCompetenceByName: (name: string) => CompetenceConfig | undefined;
  getCompetencesByChapter: (chapter: string) => CompetenceConfig[];
  normalizeCompetenceId: (identifier: string) => string | null;
}

export const useTaxonomyStore = create<TaxonomyState>((set, get) => ({
  isLoaded: false,
  chapters: [],
  chapterEmojis: {},
  competences: [],
  competencesByChapter: {},

  loadData: async () => {
    if (get().isLoaded) return; // Ne charge qu'une seule fois

    try {
      const { chapterOrder, chapterEmojis, competences } =
        await fetchTaxonomyFromDB();

      const byChapter: Record<string, CompetenceConfig[]> = {};
      for (const c of competences) {
        if (!byChapter[c.chapter]) byChapter[c.chapter] = [];
        byChapter[c.chapter].push(c);
      }

      set({
        chapters: chapterOrder,
        chapterEmojis,
        competences,
        competencesByChapter: byChapter,
        isLoaded: true,
      });
    } catch (err) {
      console.error("[TaxonomyStore] Erreur de chargement:", err);
    }
  },

  getCompetenceById: (id) => get().competences.find((c) => c.id === id),

  getCompetenceByName: (name) => get().competences.find((c) => c.name === name),

  getCompetencesByChapter: (chapter) =>
    get().competencesByChapter[chapter] ?? [],

  normalizeCompetenceId: (identifier) => {
    const comps = get().competences;
    if (comps.find((c) => c.id === identifier)) return identifier;
    const byName = comps.find((c) => c.name === identifier);
    return byName?.id ?? null;
  },
}));
