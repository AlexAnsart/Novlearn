import { evaluate as mathEvaluate } from "mathjs";
import { AnswerFormat, VariableValues } from "../../types/exercise";

// ==========================================
// 1. TRADUCTEUR UNIVERSEL (Texte/LaTeX -> Math.js)
// ==========================================

export const toMathJsSyntax = (expression: string): string => {
  if (!expression) return "";
  let expr = expression;

  // Math.js veut simplement 'e'. On le remplace AVANT tout le reste.
  expr = expr.replace(/\\exponentialE/g, "e");
  // ----------------------------------

  // 1. Nettoyage
  expr = expr.replace(/\\ /g, " ");
  expr = expr.replace(/\\left/g, "");
  expr = expr.replace(/\\right/g, "");
  expr = expr.replace(/\\displaystyle/g, "");
  expr = expr.replace(/,/g, ".");
  expr = expr.replace(/\\,/g, ".");

  // 2. INFINI (Le point critique pour les limites)
  // \infty -> Infinity
  expr = expr.replace(/\\infty/g, "Infinity");
  // +Infinity est valide en JS, mais on nettoie au cas où
  expr = expr.replace(/\+\s*Infinity/g, "Infinity");

  // 3. Constantes
  expr = expr.replace(/\\pi/g, "pi");
  // 'e' isolé seulement (pas exp)
  expr = expr.replace(/\\e/g, "e");
  expr = expr.replace(/\be\b(?![xp])/g, "e");

  // 4. Opérateurs
  expr = expr.replace(/\\times/g, "*");
  expr = expr.replace(/\\cdot/g, "*");
  expr = expr.replace(/\\div/g, "/");
  expr = expr.replace(/:/g, "/");

  // 5. FONCTIONS
  // A. Log Décimal (D'ABORD)
  expr = expr.replace(/\\log/g, "log10");
  expr = expr.replace(/\blog\b/g, "log10");

  // B. Log Népérien (ENSUITE)
  expr = expr.replace(/\\ln/g, "log");
  expr = expr.replace(/\bln\b/g, "log");

  // C. Autres
  expr = expr.replace(/\\exp/g, "exp");
  expr = expr.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, "nthRoot($2, $1)");
  expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
  ["sin", "cos", "tan", "arcsin", "arccos", "arctan", "abs"].forEach((fn) => {
    expr = expr.replace(new RegExp(`\\\\${fn}`, "g"), fn);
  });

  // 6. Puissances
  expr = expr.replace(/\^\{([^{}]+)\}/g, "^($1)");

  // 7. Fractions
  let prevExpr = "";
  while (expr !== prevExpr) {
    prevExpr = expr;
    expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))");
  }

  // 8. Multiplication Implicite
  expr = expr.replace(/(\d)\s*([a-zA-Z])/g, "$1*$2");
  expr = expr.replace(/(\d)\s*\(/g, "$1*(");
  expr = expr.replace(/\)\s*([a-zA-Z])/g, ")*$1");
  expr = expr.replace(/\)\s*\(/g, ")*(");

  return expr;
};

// ==========================================
// 2. MOTEUR D'ÉVALUATION
// ==========================================

export const evaluate = (
  expression: string,
  variables: VariableValues = {},
): number => {
  if (!expression) return NaN;

  let safeExpr = expression.toString();

  // 1. Remplacement des variables
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const value = variables[key];
    safeExpr = safeExpr.replace(
      new RegExp(`@${key}(?![a-zA-Z0-9])`, "g"),
      `(${value})`,
    );
    safeExpr = safeExpr.replace(new RegExp(`\\{${key}\\}`, "g"), `(${value})`);
  }

  // 2. Conversion
  const mathJsExpr = toMathJsSyntax(safeExpr);

  try {
    const scope = variables.x !== undefined ? { x: Number(variables.x) } : {};
    const result = mathEvaluate(mathJsExpr, scope);

    // CAS SPÉCIAL INFINI : MathJS renvoie Infinity, ce qui est un "number" en JS
    if (result === Infinity || result === -Infinity) return result;

    if (typeof result === "object" && "re" in result) return NaN;
    if (!isFinite(result)) return NaN; // NaN ou autres erreurs

    return Number(result);
  } catch (e) {
    return NaN;
  }
};

// ==========================================
// 3. VÉRIFICATION AVANCÉE (Multi-format)
// ==========================================

export const checkAnswer = (
  userInput: string,
  correctAnswer: string,
  variables: VariableValues,
  format: AnswerFormat = "number",
): boolean => {
  // Validation préliminaire
  if (!userInput || !userInput.trim()) return false;
  if (!correctAnswer || !correctAnswer.trim()) return false;

  // Dispatch selon le format
  switch (format) {
    case "text":
      return (
        userInput.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      );

    case "expression":
      return checkExpression(userInput, correctAnswer, variables);

    case "interval":
      return checkInterval(userInput, correctAnswer, variables);

    case "set":
      return checkSet(userInput, correctAnswer, variables);

    case "fraction":
      return checkFraction(userInput, correctAnswer, variables);

    case "complex":
      // Pour l'instant, comparaison textuelle normalisée
      return (
        normalizeExpression(userInput) === normalizeExpression(correctAnswer)
      );

    case "number":
    default:
      return checkNumberAnswer(userInput, correctAnswer, variables);
  }
};

/**
 * Validation pour les réponses numériques (ancien comportement).
 */
const checkNumberAnswer = (
  userInput: string,
  correctAnswer: string,
  variables: VariableValues,
): boolean => {
  // 1. Calcul des valeurs
  const expectedVal = evaluate(correctAnswer, variables);
  const userVal = evaluate(userInput, variables);

  // Si l'un des deux est invalide (NaN), c'est faux direct
  if (isNaN(expectedVal) || isNaN(userVal)) return false;

  // --- GESTION SPÉCIALE INFINI ---
  if (!isFinite(expectedVal)) {
    return userVal === expectedVal;
  }

  if (!isFinite(userVal)) {
    return false;
  }

  // --- COMPARAISON CLASSIQUE (Nombres Finis) ---
  const TOLERANCE = 0.0001;
  if (Math.abs(userVal - expectedVal) < TOLERANCE) return true;

  // --- MODE FONCTION (Seulement si tout est fini) ---
  const testX = 1.618;
  const varsWithX = { ...variables, x: testX };
  const expectedFunc = evaluate(correctAnswer, varsWithX);
  const userFunc = evaluate(userInput, varsWithX);

  if (
    !isNaN(expectedFunc) &&
    !isNaN(userFunc) &&
    isFinite(expectedFunc) &&
    isFinite(userFunc)
  ) {
    return Math.abs(userFunc - expectedFunc) < TOLERANCE;
  }

  return false;
};

export const toLatex = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "";
  // Si c'est infini, on retourne le symbole LaTeX
  if (value === Infinity) return "+\\infty";
  if (value === -Infinity) return "-\\infty";
  return String(value).replace(".", ",");
};

// ==========================================
// 4. VALIDATION D'EXPRESSIONS MATHÉMATIQUES
// ==========================================

/**
 * Normalise une expression pour comparaison.
 * Supprime les espaces, convertit en minuscules, normalise les notations.
 */
const normalizeExpression = (expr: string): string => {
  if (!expr) return "";
  let normalized = expr.trim().toLowerCase();

  // Supprimer les espaces superflus
  normalized = normalized.replace(/\s+/g, "");

  // Normaliser les notations LaTeX courantes
  normalized = normalized.replace(/\\left/g, "");
  normalized = normalized.replace(/\\right/g, "");
  normalized = normalized.replace(/\\displaystyle/g, "");
  normalized = normalized.replace(/\\,/g, "");

  // Normaliser les multiplications implicites et explicites
  normalized = normalized.replace(/\\times/g, "*");
  normalized = normalized.replace(/\\cdot/g, "*");

  // Normaliser les infinités
  normalized = normalized.replace(/\+\\infty/g, "+inf");
  normalized = normalized.replace(/-\\infty/g, "-inf");
  normalized = normalized.replace(/\\infty/g, "+inf");

  return normalized;
};

/**
 * Détecte les variables libres dans une expression (x, n, t, k, etc.)
 * Retourne un tableau des noms de variables détectées.
 */
const detectFreeVariables = (expr: string): string[] => {
  const variables: Set<string> = new Set();

  // Nettoyer l'expression des commandes LaTeX
  let cleaned = expr;
  cleaned = cleaned.replace(/\\[a-zA-Z]+/g, " "); // Supprimer les commandes LaTeX
  cleaned = cleaned.replace(/[{}()\[\]]/g, " "); // Supprimer les délimiteurs

  // Chercher les variables classiques de maths
  const commonVars = ["n", "x", "t", "k", "i", "j", "m", "p", "u", "v"];
  for (const v of commonVars) {
    // Variable isolée (pas partie d'un mot plus long comme "sin", "exp")
    const regex = new RegExp(`(?<![a-zA-Z])${v}(?![a-zA-Z])`, "g");
    if (regex.test(cleaned)) {
      variables.add(v);
    }
  }

  return Array.from(variables);
};

/**
 * Génère des valeurs de test appropriées selon le type de variable.
 * - Pour n, k, i, j, m, p : entiers positifs (suites, indices)
 * - Pour x, t, u, v : réels
 */
const getTestValuesForVariable = (varName: string): number[] => {
  // Variables typiquement entières (suites, indices)
  if (["n", "k", "i", "j", "m", "p"].includes(varName)) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 10, 15];
  }
  // Variables typiquement réelles (fonctions)
  return [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, -1, -0.5, 0.1, 0.25];
};

/**
 * Évalue une expression avec des variables spécifiques.
 * Retourne NaN si l'évaluation échoue ou produit une valeur invalide.
 */
const safeEvaluateWithVars = (
  expr: string,
  baseVariables: VariableValues,
  testVars: Record<string, number>,
): number => {
  const allVars = { ...baseVariables, ...testVars };

  // Construire l'expression avec substitution des variables de test
  let safeExpr = expr;
  for (const [varName, value] of Object.entries(testVars)) {
    // Remplacer la variable par sa valeur (attention à ne pas remplacer dans les mots)
    safeExpr = safeExpr.replace(
      new RegExp(`(?<![a-zA-Z])${varName}(?![a-zA-Z])`, "g"),
      `(${value})`,
    );
  }

  const result = evaluate(safeExpr, allVars);

  // Vérifier les valeurs interdites
  if (isNaN(result)) return NaN;
  if (!isFinite(result)) return NaN; // Division par 0, overflow

  return result;
};

/**
 * Vérifie si deux expressions mathématiques sont équivalentes.
 * Teste en substituant plusieurs valeurs numériques adaptées au type d'expression.
 * Gère automatiquement les suites (variable n) et les fonctions (variable x).
 */
export const checkExpression = (
  userInput: string,
  correctAnswer: string,
  variables: VariableValues,
): boolean => {
  // 1. Comparaison textuelle normalisée (cas trivial)
  if (normalizeExpression(userInput) === normalizeExpression(correctAnswer)) {
    return true;
  }

  // 2. Détecter les variables libres dans l'expression
  const userVars = detectFreeVariables(userInput);
  const correctVars = detectFreeVariables(correctAnswer);
  const allFreeVars = [...new Set([...userVars, ...correctVars])];

  // Si pas de variables libres, comparer comme des nombres
  if (allFreeVars.length === 0) {
    const userVal = evaluate(userInput, variables);
    const correctVal = evaluate(correctAnswer, variables);
    if (isNaN(userVal) || isNaN(correctVal)) return false;
    return Math.abs(userVal - correctVal) < 0.0001;
  }

  // 3. Générer les combinaisons de valeurs de test
  const TOLERANCE = 0.0001;
  const MIN_VALID_TESTS = 5; // Au moins 5 tests valides requis

  // Prendre la variable principale (généralement n ou x)
  const mainVar = allFreeVars.includes("n") ? "n" : allFreeVars[0];
  const testValues = getTestValuesForVariable(mainVar);

  let matchCount = 0;
  let validTests = 0;
  const errors: string[] = [];

  for (const testVal of testValues) {
    const testVars: Record<string, number> = { [mainVar]: testVal };

    // Ajouter des valeurs par défaut pour les autres variables
    for (const v of allFreeVars) {
      if (v !== mainVar) {
        testVars[v] = 1; // Valeur neutre par défaut
      }
    }

    const expectedVal = safeEvaluateWithVars(
      correctAnswer,
      variables,
      testVars,
    );
    const userVal = safeEvaluateWithVars(userInput, variables, testVars);

    // Ignorer les valeurs invalides (division par 0, racine de négatif, etc.)
    if (isNaN(expectedVal)) {
      // La correction donne NaN : c'est une valeur interdite, on skip
      continue;
    }

    if (isNaN(userVal)) {
      // L'utilisateur donne NaN mais pas la correction : erreur potentielle
      // On continue mais on note l'échec
      errors.push(
        `Test ${mainVar}=${testVal}: user=NaN, expected=${expectedVal}`,
      );
      continue;
    }

    validTests++;

    // Comparaison avec tolérance
    if (Math.abs(userVal - expectedVal) < TOLERANCE) {
      matchCount++;
    } else {
      errors.push(
        `Test ${mainVar}=${testVal}: user=${userVal}, expected=${expectedVal}`,
      );
    }
  }

  // Debug (peut être retiré en production)
  if (errors.length > 0 && validTests > 0) {
    console.debug(
      "[checkExpression] Différences détectées:",
      errors.slice(0, 3),
    );
  }

  // Validation : au moins MIN_VALID_TESTS tests valides et tous doivent correspondre
  return validTests >= MIN_VALID_TESTS && matchCount === validTests;
};

// ==========================================
// 5. VALIDATION D'INTERVALLES
// ==========================================

interface ParsedInterval {
  leftOpen: boolean; // true si ] ou (
  rightOpen: boolean; // true si [ ou )
  left: number; // -Infinity si -∞
  right: number; // Infinity si +∞
}

/**
 * Parse un intervalle depuis une chaîne (LaTeX ou notation standard)
 * Exemples: ]-∞;2], [1;5[, (-3, +∞), [0, 1]
 */
const parseInterval = (
  intervalStr: string,
  variables: VariableValues,
): ParsedInterval | null => {
  if (!intervalStr) return null;

  let str = intervalStr.trim();

  // Normaliser les infinis LaTeX
  str = str.replace(/\\infty/g, "∞");
  str = str.replace(/\+∞/g, "∞");
  str = str.replace(/-∞/g, "-∞");

  // Détecter le type de crochet gauche
  const leftOpen = str.startsWith("]") || str.startsWith("(");
  const rightOpen = str.endsWith("[") || str.endsWith(")");

  // Extraire le contenu entre crochets
  const content = str.replace(/^[\[\]\(\)]+/, "").replace(/[\[\]\(\)]+$/, "");

  // Séparer par ; ou ,
  const parts = content.split(/[;,]/);
  if (parts.length !== 2) return null;

  // Parser les bornes
  const parseValue = (val: string): number => {
    const trimmed = val.trim();
    if (trimmed === "∞" || trimmed === "+∞") return Infinity;
    if (trimmed === "-∞") return -Infinity;
    return evaluate(trimmed, variables);
  };

  const left = parseValue(parts[0]);
  const right = parseValue(parts[1]);

  if (isNaN(left) || isNaN(right)) return null;

  return { leftOpen, rightOpen, left, right };
};

/**
 * Vérifie si deux intervalles sont identiques.
 */
export const checkInterval = (
  userInput: string,
  correctAnswer: string,
  variables: VariableValues,
): boolean => {
  const userInterval = parseInterval(userInput, variables);
  const correctInterval = parseInterval(correctAnswer, variables);

  if (!userInterval || !correctInterval) return false;

  const TOLERANCE = 0.0001;

  const compareValues = (a: number, b: number): boolean => {
    if (!isFinite(a) && !isFinite(b)) return a === b;
    if (!isFinite(a) || !isFinite(b)) return false;
    return Math.abs(a - b) < TOLERANCE;
  };

  return (
    userInterval.leftOpen === correctInterval.leftOpen &&
    userInterval.rightOpen === correctInterval.rightOpen &&
    compareValues(userInterval.left, correctInterval.left) &&
    compareValues(userInterval.right, correctInterval.right)
  );
};

// ==========================================
// 6. VALIDATION D'ENSEMBLES
// ==========================================

/**
 * Parse un ensemble depuis une chaîne
 * Supporte de nombreux formats :
 * - Notation standard : {-1, 2, 5} ou {-1; 2; 5}
 * - Avec préfixe : S = {1, 2} ou x ∈ {1, 2}
 * - Ensemble vide : ∅, \emptyset, {}, vide, aucune solution
 * - Notation LaTeX : \{1, 2\}
 * L'ordre des éléments n'a pas d'importance.
 */
const parseSet = (
  setStr: string,
  variables: VariableValues,
): number[] | null => {
  if (!setStr) return null;

  let str = setStr.trim();

  // Détecter l'ensemble vide (nombreux formats acceptés)
  const emptySetPatterns = [
    "∅",
    "\\emptyset",
    "{}",
    "\\{\\}",
    "vide",
    "aucune solution",
    "pas de solution",
    "impossible",
    "aucune",
  ];
  if (emptySetPatterns.some((p) => str.toLowerCase() === p.toLowerCase())) {
    return [];
  }

  // Supprimer les préfixes courants : "S = ", "x = ", "x ∈ ", "solutions : "
  str = str.replace(/^[a-zA-Z]\s*[=∈]\s*/i, "");
  str = str.replace(/^solutions?\s*[:=]\s*/i, "");

  // Gérer les accolades LaTeX échappées
  str = str.replace(/\\{/g, "{").replace(/\\}/g, "}");

  // Extraire le contenu entre accolades
  const match = str.match(/\{([^}]*)\}/);
  if (!match) {
    // Peut-être que l'utilisateur a écrit sans accolades : "1, 2, 3" ou "1 ; 2"
    // On essaie de parser directement
    if (str.includes(",") || str.includes(";")) {
      const parts = str.split(/[;,]/);
      const values: number[] = [];
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const val = evaluate(trimmed, variables);
        if (isNaN(val)) return null;
        values.push(val);
      }
      // Éliminer les doublons et trier
      return [...new Set(values)].sort((a, b) => a - b);
    }
    return null;
  }

  const content = match[1].trim();
  if (!content) return [];

  // Séparer par ; ou , ou espaces multiples
  const parts = content.split(/[;,]|\s{2,}/);

  const values: number[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const val = evaluate(trimmed, variables);
    if (isNaN(val)) return null;
    values.push(val);
  }

  // Éliminer les doublons et trier pour comparaison
  return [...new Set(values)].sort((a, b) => a - b);
};

/**
 * Vérifie si deux ensembles sont identiques (ordre indifférent).
 * Compare les éléments triés avec une tolérance numérique.
 */
export const checkSet = (
  userInput: string,
  correctAnswer: string,
  variables: VariableValues,
): boolean => {
  const userSet = parseSet(userInput, variables);
  const correctSet = parseSet(correctAnswer, variables);

  // Debug
  console.debug("[checkSet] User set:", userSet, "| Correct set:", correctSet);

  if (userSet === null || correctSet === null) return false;
  if (userSet.length !== correctSet.length) return false;

  // Cas spécial : ensemble vide
  if (userSet.length === 0 && correctSet.length === 0) return true;

  const TOLERANCE = 0.0001;

  // Comparer élément par élément (les deux sont triés)
  for (let i = 0; i < userSet.length; i++) {
    if (Math.abs(userSet[i] - correctSet[i]) > TOLERANCE) {
      return false;
    }
  }

  return true;
};

// ==========================================
// 7. VALIDATION DE FRACTIONS
// ==========================================

interface ParsedFraction {
  numerator: number;
  denominator: number;
}

/**
 * Parse une fraction (notation standard ou LaTeX)
 * Exemples: 3/4, \frac{3}{4}, -2/5
 */
const parseFraction = (
  fractionStr: string,
  variables: VariableValues,
): ParsedFraction | null => {
  if (!fractionStr) return null;

  let str = fractionStr.trim();

  // Format LaTeX \frac{a}{b}
  const latexMatch = str.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
  if (latexMatch) {
    const num = evaluate(latexMatch[1], variables);
    const den = evaluate(latexMatch[2], variables);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return { numerator: num, denominator: den };
  }

  // Format standard a/b
  const parts = str.split("/");
  if (parts.length === 2) {
    const num = evaluate(parts[0], variables);
    const den = evaluate(parts[1], variables);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return { numerator: num, denominator: den };
  }

  // Nombre entier (fraction avec dénominateur 1)
  const val = evaluate(str, variables);
  if (!isNaN(val)) {
    return { numerator: val, denominator: 1 };
  }

  return null;
};

/**
 * Vérifie si deux fractions sont équivalentes (même valeur décimale).
 */
export const checkFraction = (
  userInput: string,
  correctAnswer: string,
  variables: VariableValues,
): boolean => {
  const userFrac = parseFraction(userInput, variables);
  const correctFrac = parseFraction(correctAnswer, variables);

  if (!userFrac || !correctFrac) return false;

  const TOLERANCE = 0.0001;
  const userValue = userFrac.numerator / userFrac.denominator;
  const correctValue = correctFrac.numerator / correctFrac.denominator;

  return Math.abs(userValue - correctValue) < TOLERANCE;
};
