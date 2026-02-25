import { evaluate as mathEvaluate, parse, simplify, fraction } from "mathjs";
import { VariableValues } from "../../types/exercise";
import { toMathJsSyntax } from "./evaluation";
import { substituteVariables } from "./parsing";

// ==========================================
// OUTILS ET CONSTANTES
// ==========================================

const PRESERVE_FUNCTIONS = [
  "ln", "log", "exp", "sqrt", "sin", "cos", "tan", 
  "arcsin", "arccos", "arctan", "pi", "e"
];

const containsPreservedFunction = (expr: string): boolean => {
  return PRESERVE_FUNCTIONS.some((fn) => {
    return new RegExp(`\\\\${fn}\\b|\\b${fn}\\s*\\(|\\b${fn}\\b`, "i").test(expr);
  });
};

/**
 * Calcule le Plus Grand Commun Diviseur (PGCD)
 */
const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
};

// ==========================================
// ÉVALUATION NUMÉRIQUE EXACTE
// ==========================================

const evaluateNumericOnly = (expr: string): number | null => {
  try {
    if (containsPreservedFunction(expr)) return null;
    const mathJsExpr = toMathJsSyntax(expr);
    if (/[a-df-hj-oq-wyzA-DF-HJ-OQ-WYZ]/.test(mathJsExpr.replace(/log10|Infinity|sqrt|nthRoot/g, ""))) {
      return null;
    }
    const result = mathEvaluate(mathJsExpr);
    return (typeof result === "number" && isFinite(result)) ? result : null;
  } catch {
    return null;
  }
};

/**
 * Convertit un nombre décimal en fraction irréductible grâce à MathJs
 */
const toSimpleFraction = (num: number): string | null => {
  try {
    const f = fraction(num) as any; 
    
    // On augmente la limite à 1000 pour accepter des dénominateurs comme 7 ou 13
    if (f.d > 1000) return null; 
    
    if (f.d === 1) return String(f.s * f.n);
    
    const sign = f.s < 0 ? "-" : "";
    return `${sign}\\frac{${f.n}}{${f.d}}`;
  } catch {
    return null;
  }
};

const formatNumberForLatex = (num: number): string => {
  if (num === Infinity) return "+\\infty";
  if (num === -Infinity) return "-\\infty";
  
  // 1. On tente d'abord la fraction sur le nombre BRUT (très important !)
  const frac = toSimpleFraction(num);
  if (frac) return frac;

  // 2. Si ce n'est pas une fraction, on arrondit pour l'affichage décimal
  const rounded = Math.round(num * 10000000) / 10000000;
  if (Number.isInteger(rounded)) return String(rounded);
  
  return parseFloat(rounded.toFixed(4)).toString();
};

// ==========================================
// SIMPLIFICATION INTERNE
// ==========================================

const simplifyNumericParts = (expr: string): string => {
  // Gérer explicitement a / b pour préserver les fractions
  let result = expr.replace(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/g, (match, numStr, denomStr) => {
    const num = parseFloat(numStr);
    const denom = parseFloat(denomStr);
    if (denom === 0) return match;

    // Si ce sont des entiers, on fait une vraie simplification de fraction via PGCD
    if (Number.isInteger(num) && Number.isInteger(denom)) {
      const gcdVal = gcd(num, denom);
      const sNum = num / gcdVal;
      const sDenom = denom / gcdVal;

      if (sDenom === 1) return String(sNum);
      
      const sign = (sNum < 0) !== (sDenom < 0) ? "-" : "";
      return `${sign}\\frac{${Math.abs(sNum)}}{${Math.abs(sDenom)}}`;
    }

    const res = num / denom;
    return isFinite(res) ? formatNumberForLatex(res) : match;
  });

  result = result.replace(/(-?\d+(?:\.\d+)?)\s*\*\s*(-?\d+(?:\.\d+)?)/g, (match, a, b) => {
    const res = parseFloat(a) * parseFloat(b);
    return isFinite(res) ? formatNumberForLatex(res) : match;
  });

  return result;
};

const getPerfectSquareRoot = (num: number): number | null => {
  if (num < 0) return null;
  const sqrt = Math.sqrt(num);
  return Number.isInteger(sqrt) ? sqrt : null;
};

const simplifyInnerExpression = (expr: string): string => {
  const cleaned = expr.trim();
  const numResult = evaluateNumericOnly(cleaned);
  if (numResult !== null) return formatNumberForLatex(numResult);
  return simplifyNumericParts(cleaned);
};

const simplifyFunctionArguments = (expr: string): string => {
  let result = expr;

  // 1. \sqrt{...}
  result = result.replace(/\\sqrt\s*\{([^{}]+)\}/g, (match, innerContent) => {
    const simplified = simplifyInnerExpression(innerContent);
    const numValue = evaluateNumericOnly(simplified);

    if (numValue !== null) {
      const sqrtValue = getPerfectSquareRoot(numValue);
      if (sqrtValue !== null) return String(sqrtValue);
      return `\\sqrt{${formatNumberForLatex(numValue)}}`;
    }
    return `\\sqrt{${simplified}}`;
  });

  // 2. ln(...) et exp(...)
  ['ln', 'exp'].forEach(fn => {
    result = result.replace(new RegExp(`(?:\\\\)?${fn}\\s*\\(([^()]+)\\)`, "g"), (match, innerContent) => {
      const simplified = simplifyInnerExpression(innerContent);
      const numValue = evaluateNumericOnly(simplified);
      return numValue !== null ? `\\${fn}(${formatNumberForLatex(numValue)})` : `\\${fn}(${simplified})`;
    });
  });

  // 3. Fonctions Trigonométriques
  ["sin", "cos", "tan", "arcsin", "arccos", "arctan"].forEach((fn) => {
    result = result.replace(new RegExp(`(?:\\\\)?${fn}\\s*\\(([^()]+)\\)`, "g"), (match, innerContent) => {
      const simplified = simplifyInnerExpression(innerContent);
      const numValue = evaluateNumericOnly(simplified);
      return numValue !== null ? `\\${fn}(${formatNumberForLatex(numValue)})` : `\\${fn}(${simplified})`;
    });
  });

  // 4. Puissances ^{...}
  result = result.replace(/\^\{([^{}]+)\}/g, (match, innerContent) => {
    const simplified = simplifyInnerExpression(innerContent);
    const numValue = evaluateNumericOnly(simplified);
    return numValue !== null ? `^{${formatNumberForLatex(numValue)}}` : `^{${simplified}}`;
  });

  // 5. Fractions \frac{...}{...}
  result = result.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, denom) => {
    const simplifiedNum = simplifyInnerExpression(num);
    const simplifiedDenom = simplifyInnerExpression(denom);

    const numValue = evaluateNumericOnly(simplifiedNum);
    const denomValue = evaluateNumericOnly(simplifiedDenom);

    if (numValue !== null && denomValue !== null && denomValue !== 0) {
      // Conservation pure de la fraction si ce sont des entiers !
      if (Number.isInteger(numValue) && Number.isInteger(denomValue)) {
        const gcdVal = gcd(numValue, denomValue);
        const sNum = numValue / gcdVal;
        const sDenom = denomValue / gcdVal;

        if (sDenom === 1) return String(sNum);
        
        const sign = (sNum < 0) !== (sDenom < 0) ? "-" : "";
        return `${sign}\\frac{${Math.abs(sNum)}}{${Math.abs(sDenom)}}`;
      }

      const divResult = numValue / denomValue;
      if (Number.isInteger(divResult)) return String(divResult);
      
      return `\\frac{${formatNumberForLatex(numValue)}}{${formatNumberForLatex(denomValue)}}`;
    }
    return `\\frac{${simplifiedNum}}{${simplifiedDenom}}`;
  });

  return result;
};

// ==========================================
// RENDU FINAL
// ==========================================

const uniformizeLatex = (latex: string): string => {
  let result = latex;

  result = result.replace(/\s*\*\s*/g, " \\cdot ");
  result = result.replace(/\\times/g, "\\cdot");
  result = result.replace(/\s+/g, " ").trim();
  
  // Nettoyage des balises de taille mathlive
  result = result.replace(/\\left\./g, "");
  result = result.replace(/\\right\./g, "");
  result = result.replace(/\\left\s*\\?lbrack/g, "\\lbrack");
  result = result.replace(/\\right\s*\\?rbrack/g, "\\rbrack");
  result = result.replace(/\\left\s*\\?rbrack/g, "\\rbrack");
  result = result.replace(/\\right\s*\\?lbrack/g, "\\lbrack");

  // === LA SEULE NOUVEAUTÉ : Suppression des divisions par 1 ===
  
  // 1. Supprime les \frac{numérateur}{1} pour ne garder que le numérateur
  // La regex gère jusqu'à un niveau d'accolades imbriquées dans le numérateur
  let prev = "";
  while (result !== prev) {
    prev = result;
    result = result.replace(/\\(?:d|c|t)?frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{1\}/g, "$1");
  }
  
  // 2. Supprime les divisions en ligne : / 1
  result = result.replace(/\/\s*1(?![0-9.])/g, "");
  
  // ============================================================

  // Le reste du code d'origine (nettoyage standard post-MathJs)
  result = result.replace(/(?<![\d.])1\s*\\cdot\s*/g, "");
  result = result.replace(/\\cdot\s*1(?![0-9])/g, "");

  result = result.replace(/[+-]\s*0(?![0-9.])/g, "");
  result = result.replace(/^\s*0\s*([+-])/, "$1"); 

  result = result.replace(/--/g, "+");
  result = result.replace(/\+-/g, "-");
  result = result.replace(/-\+/g, "-");
  result = result.replace(/^\s*\+/, "");

  result = result.replace(/\\?ln\s*\(/g, "\\ln(");
  result = result.replace(/\\?exp\s*\(/g, "\\exp(");
  result = result.replace(/\\?sqrt\s*\{/g, "\\sqrt{");

  if (latex.trim() !== "" && result.trim() === "") return "0";

  return result.trim();
};

export const simplifyLatexExpression = (
  latex: string,
  variables: VariableValues,
): string => {
  if (!latex) return "";

  let safeExpr = substituteVariables(latex, variables).replace(/\$/g, "");

  const intervalRegex = /^\s*([\]\[])\s*(.+?)\s*[;,]\s*(.+?)\s*([\]\[])\s*$/;
  const intervalMatch = safeExpr.match(intervalRegex);
  if (intervalMatch) {
    const leftBracket = intervalMatch[1];
    const leftVal = simplifyLatexExpression(intervalMatch[2], {}); 
    const rightVal = simplifyLatexExpression(intervalMatch[3], {});
    const rightBracket = intervalMatch[4];
    return `${leftBracket}${leftVal}; ${rightVal}${rightBracket}`;
  }

  if (safeExpr.includes(';')) {
    const parts = safeExpr.split(/\s*;\s*/);
    const simplifiedParts = parts.map(p => simplifyLatexExpression(p, {}));
    return simplifiedParts.join(' ; ');
  }

  const setRegex = /^\s*\\?\{\s*(.*?)\s*\\?\}\s*$/;
  const setMatch = safeExpr.match(setRegex);
  if (setMatch) {
    const content = setMatch[1].trim();
    if (content === "") return "\\emptyset";
    return `\\{${simplifyLatexExpression(content, {})}\\}`;
  }

  const numericResult = evaluateNumericOnly(safeExpr);
  if (numericResult !== null) {
    return formatNumberForLatex(numericResult);
  }

  if (containsPreservedFunction(safeExpr)) {
    let result = simplifyFunctionArguments(safeExpr);
    result = simplifyNumericParts(result);
    return uniformizeLatex(result);
  }

  try {
    const mathJsSyntax = toMathJsSyntax(safeExpr);
    const node = parse(mathJsSyntax);
    const simplifiedNode = simplify(node);
    
    return uniformizeLatex(simplifiedNode.toTex());
  } catch {
    return uniformizeLatex(simplifyNumericParts(safeExpr));
  }
};