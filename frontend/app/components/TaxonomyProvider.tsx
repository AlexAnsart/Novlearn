"use client";

import { useEffect } from "react";
import { useTaxonomyStore } from "../store/useTaxonomyStore";

/**
 * Lance le chargement de la taxonomie (chapitres + compétences) depuis Supabase
 * dès l'ouverture de l'app. Le store Zustand met tout en cache en RAM.
 */
export function TaxonomyProvider({ children }: { children: React.ReactNode }) {
  const loadData = useTaxonomyStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return <>{children}</>;
}
