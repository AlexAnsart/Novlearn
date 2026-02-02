'use client';

import React, { useEffect, useRef } from 'react';
import { VariableValues } from '../../types/exercise';
// Imports depuis vos nouveaux utilitaires math
import { substituteVariables, parseMathText } from '../../utils/math/parsing';
import { toLatex } from '../../utils/math/evaluation'; 
import { getKaTeX } from './katexUtils';

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
}

const MathText: React.FC<MathTextProps> = ({
  content,
  variables = {},
  className = '',
  displayMode = false,
  autoLatex = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Substitue les variables (utilise maintenant formatting.ts via parsing.ts)
  const substitutedContent = substituteVariables(content, variables);

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

      // Si displayMode forcé et pas de délimiteurs, traiter tout comme du math
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

      // Parser le texte pour trouver les segments math vs texte
      const segments = parseMathText(substitutedContent);
      
      container.innerHTML = '';

      segments.forEach((segment) => {
        if (segment.type === 'text') {
          const textNode = document.createElement('span');
          textNode.textContent = segment.content;
          container.appendChild(textNode);
        } else {
          const mathSpan = document.createElement('span');
          // Ajout de classes pour le ciblage CSS éventuel
          mathSpan.className = segment.type === 'display-math' ? 'katex-display-block' : 'katex-inline';
          
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

export default MathText;