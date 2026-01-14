import { VariableValues } from '../../types/exercise';
import { formatValue, cleanMathExpression } from './formatting';

/**
 * Substitue les variables dans le texte et applique le nettoyage mathématique.
 * Supporte la syntaxe {variable} et gère intelligemment les signes.
 */
export const substituteVariables = (text: string, variables: VariableValues = {}): string => {
  if (!text) return '';
  if (Object.keys(variables).length === 0) return text;

  // On protège temporairement les @ pour éviter les conflits si on en utilise
  let result = text.replace(/@/g, '##ESCAPED_AT##');

  // Trier les clés par longueur décroissante pour éviter qu'une variable "a" remplace le début de "ab"
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);

  sortedKeys.forEach(key => {
    const value = variables[key];
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    
    // Regex : Cherche {key} avec un potentiel signe devant
    // Capture group 1: signe (+ ou - ou vide)
    // Capture group 2: espaces
    const regex = new RegExp(`([+\\-]?)(\\s*)\\{${key}\\}`, 'g');
    
    result = result.replace(regex, (match, sign, space) => {
      // Si ce n'est pas un nombre, on remplace simplement
      if (isNaN(numValue)) return (sign || '') + (space || '') + formatValue(value);

      const formattedAbs = formatValue(Math.abs(numValue));

      // Gestion intelligente des signes
      if (sign === '+') {
        // "+ {a}" avec a < 0  -> "- a"
        if (numValue < 0) return `${space}- ${formattedAbs}`;
        return `${space}+ ${formattedAbs}`;
      } 
      else if (sign === '-') {
        // "- {a}" avec a < 0 -> "+ a"
        if (numValue < 0) return `${space}+ ${formattedAbs}`;
        return `${space}- ${formattedAbs}`;
      }
      
      // Pas de signe devant, mais le nombre est négatif
      if (numValue < 0) return `${space}-${formattedAbs}`;
      
      return (sign || '') + (space || '') + formatValue(value);
    });
  });

  // Restauration et nettoyage final
  result = result.replace(/##ESCAPED_AT##/g, '@');
  return cleanMathExpression(result);
};

// Interface pour les segments de texte parsés
export interface TextSegment {
  type: 'text' | 'math' | 'display-math';
  content: string;
}

/**
 * Découpe le texte en segments (texte brut, math inline $, math display $$)
 */
export function parseMathText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    const mathContent = match[0];
    if (mathContent.startsWith('$$')) {
      segments.push({
        type: 'display-math',
        content: mathContent.slice(2, -2)
      });
    } else {
      segments.push({
        type: 'math',
        content: mathContent.slice(1, -1)
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return segments;
}