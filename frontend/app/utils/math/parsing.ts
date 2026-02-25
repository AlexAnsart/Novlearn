import { VariableValues } from "../../types/exercise";
import { formatValue, cleanMathExpression } from "./formatting"; 

// ==========================================
// 1. SUBSTITUTION DES VARIABLES (@variable)
// ==========================================

export const substituteVariables = (
  text: string,
  variables: VariableValues = {}
): string => {
  if (!text) return "";
  if (Object.keys(variables).length === 0) return text.replace(/@@/g, "@");

  let result = text.replace(/@@/g, "##ESCAPED_AT##");

  // Tri par longueur décroissante (important pour remplacer @alpha avant @a)
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);

  sortedKeys.forEach((key) => {
    const value = variables[key];
    const numValue = typeof value === "number" ? value : parseFloat(value as string);
    const formattedValue = formatValue(value);

    // Permet @a_ mais bloque @ab
    const regex = new RegExp(`([+\\-]?)(\\s*)@${key}(?![a-zA-Z0-9])`, "g");

    result = result.replace(regex, (match, sign, space) => {
      if (isNaN(numValue)) {
        return (sign || "") + (space || "") + formattedValue;
      }

      const formattedAbs = formatValue(Math.abs(numValue));

      // Gestion intelligente des signes
      if (sign === "+") {
        if (numValue < 0) return `${space}- ${formattedAbs}`;
        return `${space}+ ${formattedAbs}`;
      } else if (sign === "-") {
        if (numValue < 0) return `${space}+ ${formattedAbs}`;
        return `${space}- ${formattedAbs}`;
      }

      if (numValue < 0) return `${space}-${formattedAbs}`;

      return (sign || "") + (space || "") + formattedValue;
    });

    // Optionnel : remplace aussi la syntaxe LaTeX {variable} 
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), `(${value})`);
  });

  result = result.replace(/##ESCAPED_AT##/g, "@");
  
  // On passe le résultat à cleanMathExpression pour nettoyer les "+ -" générés
  return cleanMathExpression(result);
};

// ==========================================
// 2. PARSING TEXTE / MATHS
// ==========================================

export interface TextSegment {
  type: "text" | "math" | "display-math";
  content: string;
}

export function parseMathText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const mathContent = match[0];
    if (mathContent.startsWith("$$")) {
      segments.push({
        type: "display-math",
        content: mathContent.slice(2, -2),
      });
    } else {
      segments.push({
        type: "math",
        content: mathContent.slice(1, -1),
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}