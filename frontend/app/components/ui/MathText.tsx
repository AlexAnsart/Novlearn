/**
 * Composant MathText - Rendu de texte avec formules mathématiques
 * Utilise KaTeX via CDN (inclure dans votre HTML)
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { VariableValues } from '../../types/exercise';
import { substituteVariables, toLatex, parseMathText } from '../../utils/MathParser';

// Interface pour KaTeX
interface KaTeXStatic {
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

// Fonction pour obtenir KaTeX de manière sûre
function getKaTeX(): KaTeXStatic | null {
  if (typeof window !== 'undefined' && 'katex' in window) {
    return (window as unknown as { katex: KaTeXStatic }).katex;
  }
  return null;
}

interface MathTextProps {
  /** Le contenu à afficher (peut contenir $...$ pour les maths) */
  content: string;
  /** Les variables à substituer */
  variables?: VariableValues;
  /** Classes CSS additionnelles */
  className?: string;
  /** Mode display (centré, plus grand) vs inline */
  displayMode?: boolean;
  /** Convertir automatiquement en LaTeX (pour les expressions simples) */
  autoLatex?: boolean;
  /** Exiger les accolades {a} pour la substitution (sinon substitue aussi 'a' directement) */
  requireBraces?: boolean;
}

/**
 * Composant pour afficher du texte avec des formules mathématiques
 * Utilise la syntaxe $...$ pour inline et $$...$$ pour display
 * 
 * @example
 * <MathText content="La fonction $f(x) = {a}x^2$" variables={{ a: 3 }} />
 */
export const MathText: React.FC<MathTextProps> = ({
  content,
  variables = {},
  className = '',
  displayMode = false,
  autoLatex = false,
  requireBraces = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Substitue les variables
  const substitutedContent = substituteVariables(content, variables, { 
    useBraces: requireBraces 
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const renderMath = () => {
      const katex = getKaTeX();
      
      if (!katex) {
        // KaTeX pas encore chargé, réessayer
        setTimeout(renderMath, 100);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      // Si displayMode et pas de délimiteurs, traiter tout comme du math
      if (displayMode && !content.includes('$')) {
        const latex = autoLatex ? toLatex(substitutedContent) : substitutedContent;
        try {
          container.innerHTML = '';
          katex.render(latex, container, {
            displayMode: true,
            throwOnError: false,
          });
        } catch {
          container.textContent = substitutedContent;
        }
        return;
      }

      // Parser le texte pour trouver les segments math
      const segments = parseMathText(substitutedContent);
      
      container.innerHTML = '';

      segments.forEach((segment) => {
        if (segment.type === 'text') {
          const textNode = document.createElement('span');
          textNode.textContent = segment.content;
          container.appendChild(textNode);
        } else {
          const mathSpan = document.createElement('span');
          const latex = autoLatex ? toLatex(segment.content) : segment.content;
          try {
            katex.render(latex, mathSpan, {
              displayMode: segment.type === 'display-math',
              throwOnError: false,
            });
          } catch {
            mathSpan.textContent = segment.content;
          }
          container.appendChild(mathSpan);
        }
      });
    };

    renderMath();
  }, [substitutedContent, displayMode, autoLatex, content]);

  return (
    <div 
      ref={containerRef} 
      className={`math-text ${className}`}
      style={{ fontFamily: "'Fredoka', sans-serif" }}
    />
  );
};

/**
 * Composant simple pour afficher une formule LaTeX
 */
interface LatexProps {
  /** Expression LaTeX */
  children: string;
  /** Variables à substituer */
  variables?: VariableValues;
  /** Mode display (bloc centré) */
  display?: boolean;
  /** Classes CSS */
  className?: string;
}

export const Latex: React.FC<LatexProps> = ({
  children,
  variables = {},
  display = false,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const substituted = substituteVariables(children, variables);

  useEffect(() => {
    const katex = getKaTeX();
    if (!ref.current || !katex) return;

    try {
      katex.render(substituted, ref.current, {
        displayMode: display,
        throwOnError: false,
      });
    } catch {
      if (ref.current) {
        ref.current.textContent = substituted;
      }
    }
  }, [substituted, display]);

  return <span ref={ref} className={className} />;
};

export default MathText;