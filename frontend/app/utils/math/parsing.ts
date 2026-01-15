import { VariableValues } from "../../types/exercise";

// ==========================================
// 1. FORMATAGE DES NOMBRES
// ==========================================

export const formatValue = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined) return "";
  const numValue =
    typeof value === "number" ? value : parseFloat(value as string);

  if (isNaN(numValue)) return String(value);

  return Number.isInteger(numValue)
    ? numValue.toString()
    : parseFloat(numValue.toFixed(4)).toString();
};

// ==========================================
// 2. NETTOYAGE MATHÉMATIQUE (Style 'src')
// ==========================================

export const cleanMathExpression = (expression: string): string => {
  let cleaned = expression;

  // 1. Gérer le coefficient 0 (0x, 0\pi...) -> "0"
  cleaned = cleaned.replace(/(?<![\d.])0\s*[a-zA-Z\\][a-zA-Z0-9^_{}\\]*/g, "0");

  // 2. Gérer le coefficient 1 (1x -> x, 1\pi -> \pi)
  cleaned = cleaned.replace(/(?<![\d.])1\s*([a-zA-Z\\])/g, "$1");

  // 3. NETTOYAGE DES ZÉROS
  cleaned = cleaned.replace(/[+-]\s*0(?![0-9.])/g, "");
  cleaned = cleaned.replace(/^\s*0\s*([+-])/, "$1");

  // 4. GESTION DES SIGNES
  cleaned = cleaned.replace(/\+\s*-/g, "-");
  cleaned = cleaned.replace(/-\s*-/g, "+");
  cleaned = cleaned.replace(/\+\s*\+/g, "+");
  cleaned = cleaned.replace(/\+ -/g, "-");
  cleaned = cleaned.replace(/\+-/g, "-");
  cleaned = cleaned.replace(/--/g, "+");

  // 5. NETTOYAGE DÉBUT DE LIGNE
  cleaned = cleaned.replace(/^\s*\+/, "");

  // 6. Parenthèses inutiles
  cleaned = cleaned.replace(/\((\d+\.?\d*)\)/g, "$1");

  if (expression.trim() !== "" && cleaned.trim() === "") {
    return "0";
  }

  return cleaned.replace(/\s+/g, " ").trim();
};

// ==========================================
// 3. SUBSTITUTION DES VARIABLES (@variable)
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
    const numValue =
      typeof value === "number" ? value : parseFloat(value as string);
    const formattedValue = formatValue(value);

    // CORRECTION ICI : J'ai retiré le "_" du lookahead négatif (?![...])
    // Avant : (?![a-zA-Z0-9_]) => Bloquait sur @a_
    // Après : (?![a-zA-Z0-9])  => Autorise @a_ mais bloque @ab
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
  });

  result = result.replace(/##ESCAPED_AT##/g, "@");
  return cleanMathExpression(result);
};

// ==========================================
// 4. PARSING TEXTE / MATHS
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
