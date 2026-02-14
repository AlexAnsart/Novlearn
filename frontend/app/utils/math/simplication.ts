import { evaluate, parse, simplify } from "mathjs";
import { VariableValues } from "../../types/exercise";
import { toMathJsSyntax } from "./evaluation";

// Liste des fonctions à ne PAS évaluer numériquement
const PRESERVE_FUNCTIONS = [
  "ln",
  "log",
  "exp",
  "sqrt",
  "sin",
  "cos",
  "tan",
  "arcsin",
  "arccos",
  "arctan",
  "pi",
  "e",
];

/**
 * Vérifie si une expression contient des fonctions transcendantes à préserver
 */
const containsPreservedFunction = (expr: string): boolean => {
  const lowerExpr = expr.toLowerCase();
  return PRESERVE_FUNCTIONS.some((fn) => {
    // Vérifier les versions LaTeX et texte
    const patterns = [
      new RegExp(`\\\\${fn}\\b`, "i"),
      new RegExp(`\\b${fn}\\s*\\(`, "i"),
      new RegExp(`\\b${fn}\\b`, "i"),
    ];
    return patterns.some((p) => p.test(expr));
  });
};

/**
 * Évalue une expression purement numérique
 * Retourne le nombre ou null si l'expression contient des variables/fonctions
 */
const evaluateNumericOnly = (expr: string): number | null => {
  try {
    // Vérifier qu'il n'y a pas de fonctions à préserver
    if (containsPreservedFunction(expr)) return null;

    const mathJsExpr = toMathJsSyntax(expr);

    // Vérifier qu'il n'y a pas de variables (lettres isolées)
    if (
      /[a-df-hj-oq-wyzA-DF-HJ-OQ-WYZ]/.test(
        mathJsExpr.replace(/log10|Infinity|sqrt|nthRoot/g, ""),
      )
    ) {
      return null;
    }

    const result = evaluate(mathJsExpr);

    if (typeof result !== "number" || !isFinite(result)) return null;

    return result;
  } catch {
    return null;
  }
};

/**
 * Formate un nombre pour l'affichage LaTeX
 */
const formatNumberForLatex = (num: number): string => {
  if (num === Infinity) return "+\\infty";
  if (num === -Infinity) return "-\\infty";

  // Arrondir pour éviter les erreurs de virgule flottante
  const rounded = Math.round(num * 1000000) / 1000000;

  // Si c'est un entier, pas de décimales
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  // Vérifier si c'est une fraction simple
  const fraction = toSimpleFraction(rounded);
  if (fraction) {
    return fraction;
  }

  // Sinon, arrondir à 4 décimales max
  return parseFloat(rounded.toFixed(4)).toString();
};

/**
 * Convertit un nombre décimal en fraction simple si possible
 */
const toSimpleFraction = (num: number): string | null => {
  const tolerance = 0.0001;

  // Tableau des dénominateurs courants à tester
  const denominators = [2, 3, 4, 5, 6, 8, 10, 12];

  for (const denom of denominators) {
    const numer = Math.round(num * denom);
    if (Math.abs(numer / denom - num) < tolerance) {
      // Simplifier la fraction
      const gcd = (a: number, b: number): number =>
        b === 0 ? Math.abs(a) : gcd(b, a % b);
      const divisor = gcd(numer, denom);
      const simplifiedNum = numer / divisor;
      const simplifiedDenom = denom / divisor;

      if (simplifiedDenom === 1) {
        return String(simplifiedNum);
      }

      if (simplifiedNum < 0) {
        return `-\\frac{${Math.abs(simplifiedNum)}}{${simplifiedDenom}}`;
      }
      return `\\frac{${simplifiedNum}}{${simplifiedDenom}}`;
    }
  }

  return null;
};

/**
 * Simplifie les expressions numériques simples dans une expression plus complexe
 * Exemples: "8/2" -> "4", "3*4" -> "12", mais "ln(2)" reste "ln(2)"
 */
const simplifyNumericParts = (expr: string): string => {
  // Pattern pour trouver les fractions numériques simples: nombre/nombre
  expr = expr.replace(
    /(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/g,
    (match, num, denom) => {
      const result = parseFloat(num) / parseFloat(denom);
      if (isFinite(result)) {
        return formatNumberForLatex(result);
      }
      return match;
    },
  );

  // Pattern pour trouver les multiplications numériques: nombre*nombre
  expr = expr.replace(
    /(-?\d+(?:\.\d+)?)\s*\*\s*(-?\d+(?:\.\d+)?)/g,
    (match, a, b) => {
      const result = parseFloat(a) * parseFloat(b);
      if (isFinite(result)) {
        return formatNumberForLatex(result);
      }
      return match;
    },
  );

  return expr;
};

/**
 * Vérifie si un nombre est un carré parfait et retourne sa racine
 */
const getPerfectSquareRoot = (num: number): number | null => {
  if (num < 0) return null;
  const sqrt = Math.sqrt(num);
  if (Number.isInteger(sqrt)) return sqrt;
  return null;
};

/**
 * Simplifie une expression interne (calcule les opérations numériques)
 */
const simplifyInnerExpression = (expr: string): string => {
  // Nettoyer l'expression
  let cleaned = expr.trim();

  // Essayer d'évaluer numériquement
  const numResult = evaluateNumericOnly(cleaned);
  if (numResult !== null) {
    return formatNumberForLatex(numResult);
  }

  // Sinon simplifier les parties numériques
  return simplifyNumericParts(cleaned);
};

/**
 * Simplifie les arguments à l'intérieur des fonctions (ln, sqrt, exp, etc.)
 * Exemples: \ln(8/2) -> \ln(4), \sqrt{16/4} -> 2, \exp(6/2) -> \exp(3)
 */
const simplifyFunctionArguments = (expr: string): string => {
  let result = expr;

  // 1. Simplifier \sqrt{...} - avec accolades
  result = result.replace(/\\sqrt\s*\{([^{}]+)\}/g, (match, innerContent) => {
    const simplified = simplifyInnerExpression(innerContent);
    const numValue = evaluateNumericOnly(simplified);

    if (numValue !== null) {
      // Vérifier si c'est un carré parfait
      const sqrtValue = getPerfectSquareRoot(numValue);
      if (sqrtValue !== null) {
        return String(sqrtValue);
      }
      return `\\sqrt{${formatNumberForLatex(numValue)}}`;
    }
    return `\\sqrt{${simplified}}`;
  });

  // 2. Simplifier \ln(...) - avec parenthèses
  result = result.replace(/\\ln\s*\(([^()]+)\)/g, (match, innerContent) => {
    const simplified = simplifyInnerExpression(innerContent);
    const numValue = evaluateNumericOnly(simplified);

    if (numValue !== null) {
      return `\\ln(${formatNumberForLatex(numValue)})`;
    }
    return `\\ln(${simplified})`;
  });

  // 3. Simplifier \exp(...) - avec parenthèses
  result = result.replace(/\\exp\s*\(([^()]+)\)/g, (match, innerContent) => {
    const simplified = simplifyInnerExpression(innerContent);
    const numValue = evaluateNumericOnly(simplified);

    if (numValue !== null) {
      return `\\exp(${formatNumberForLatex(numValue)})`;
    }
    return `\\exp(${simplified})`;
  });

  // 4. Simplifier \sin, \cos, \tan, etc.
  const trigFunctions = ["sin", "cos", "tan", "arcsin", "arccos", "arctan"];
  for (const fn of trigFunctions) {
    const regex = new RegExp(`\\\\${fn}\\s*\\(([^()]+)\\)`, "g");
    result = result.replace(regex, (match, innerContent) => {
      const simplified = simplifyInnerExpression(innerContent);
      const numValue = evaluateNumericOnly(simplified);

      if (numValue !== null) {
        return `\\${fn}(${formatNumberForLatex(numValue)})`;
      }
      return `\\${fn}(${simplified})`;
    });
  }

  // 5. Simplifier les puissances ^{...}
  result = result.replace(/\^\{([^{}]+)\}/g, (match, innerContent) => {
    const simplified = simplifyInnerExpression(innerContent);
    const numValue = evaluateNumericOnly(simplified);

    if (numValue !== null) {
      return `^{${formatNumberForLatex(numValue)}}`;
    }
    return `^{${simplified}}`;
  });

  // 6. Simplifier les fractions \frac{...}{...}
  result = result.replace(
    /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
    (match, num, denom) => {
      const simplifiedNum = simplifyInnerExpression(num);
      const simplifiedDenom = simplifyInnerExpression(denom);

      const numValue = evaluateNumericOnly(simplifiedNum);
      const denomValue = evaluateNumericOnly(simplifiedDenom);

      if (numValue !== null && denomValue !== null && denomValue !== 0) {
        const divResult = numValue / denomValue;
        // Si c'est un entier, retourner directement le nombre
        if (Number.isInteger(divResult)) {
          return String(divResult);
        }
        // Sinon garder la fraction mais simplifiée
        return `\\frac{${formatNumberForLatex(numValue)}}{${formatNumberForLatex(denomValue)}}`;
      }

      return `\\frac{${simplifiedNum}}{${simplifiedDenom}}`;
    },
  );

  return result;
};

/**
 * Uniformise le format LaTeX pour l'affichage
 */
const uniformizeLatex = (latex: string): string => {
  let result = latex;

  // Uniformiser les multiplications en \cdot (plus élégant)
  result = result.replace(/\s*\*\s*/g, " \\cdot ");
  result = result.replace(/\\times/g, "\\cdot");

  // Nettoyer les espaces multiples
  result = result.replace(/\s+/g, " ").trim();

  // Supprimer les \cdot inutiles devant les parenthèses ou variables
  result = result.replace(/\\cdot\s*\\left/g, "\\left");
  result = result.replace(/1\s*\\cdot\s*/g, "");
  result = result.replace(/\\cdot\s*1(?![0-9])/g, "");

  // Nettoyer les doubles négations
  result = result.replace(/--/g, "+");
  result = result.replace(/\+-/g, "-");
  result = result.replace(/-\+/g, "-");

  // Format correct pour ln et exp
  result = result.replace(/\\ln\s*\(/g, "\\ln(");
  result = result.replace(/\\exp\s*\(/g, "\\exp(");
  result = result.replace(/\\sqrt\s*\{/g, "\\sqrt{");

  return result;
};

export const simplifyLatexExpression = (
  latex: string,
  variables: VariableValues,
): string => {
  if (!latex) return "";

  // 1. Substitution des variables (ex: @a -> 4, @b -> 2)
  let safeExpr = latex;
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const value = variables[key];
    safeExpr = safeExpr.replace(
      new RegExp(`@${key}(?![a-zA-Z0-9])`, "g"),
      String(value),
    );
    safeExpr = safeExpr.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }

  // 2. Nettoyage des $ (si présents)
  safeExpr = safeExpr.replace(/\$/g, "");

  // 3. Vérifier si c'est une expression purement numérique
  const numericResult = evaluateNumericOnly(safeExpr);
  if (numericResult !== null) {
    return formatNumberForLatex(numericResult);
  }

  // 4. Si l'expression contient des fonctions à préserver, simplifier les arguments internes
  if (containsPreservedFunction(safeExpr)) {
    // D'abord simplifier les arguments des fonctions
    let result = simplifyFunctionArguments(safeExpr);
    // Puis simplifier les parties numériques restantes
    result = simplifyNumericParts(result);
    return uniformizeLatex(result);
  }

  // 5. Pour les autres expressions, utiliser la simplification symbolique de mathjs
  try {
    const mathJsSyntax = toMathJsSyntax(safeExpr);
    const node = parse(mathJsSyntax);
    const simplifiedNode = simplify(node);

    let resultLatex = simplifiedNode.toTex();

    return uniformizeLatex(resultLatex);
  } catch {
    // Si l'expression est trop complexe ou invalide, on renvoie la version substituée avec simplification partielle
    return uniformizeLatex(simplifyNumericParts(safeExpr));
  }
};
