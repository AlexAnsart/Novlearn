'use client';

// Interface pour le typage de KaTeX
export interface KaTeXStatic {
  render: (
    latex: string,
    element: HTMLElement,
    options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      errorColor?: string;
    }
  ) => void;
}

// Fonction helper pour récupérer l'instance KaTeX depuis window
export function getKaTeX(): KaTeXStatic | null {
  if (typeof window !== 'undefined' && 'katex' in window) {
    return (window as unknown as { katex: KaTeXStatic }).katex;
  }
  return null;
}