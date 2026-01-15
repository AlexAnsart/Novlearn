import { VariableValues } from '../../types/exercise';

/**
 * Prépare une expression pour l'évaluation JavaScript (Math.sin, etc.)
 */
const prepareForEval = (expression: string): string => {
  return expression
    .replace(/\^/g, '**')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\blog\b/g, 'Math.log10')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b(?![xp])/gi, 'Math.E');
};

/**
 * Évalue une expression mathématique avec des variables
 * @param expression L'expression (ex: "2*@a + 5")
 * @param variables Les valeurs (ex: {a: 3})
 */
export const evaluate = (expression: string, variables: VariableValues = {}): number => {
  if (!expression) return NaN;
  
  let safeExpr = expression.toString();

  // 1. Remplacer les variables @variable
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const value = variables[key];
    // Remplace @key par (value) pour sécuriser les nombres négatifs
    // Gère @key et {key}
    safeExpr = safeExpr.replace(new RegExp(`@${key}(?![a-zA-Z0-9])`, 'g'), `(${value})`);
    safeExpr = safeExpr.replace(new RegExp(`\\{${key}\\}`, 'g'), `(${value})`);
  }
  
  // Gère aussi le cas où la variable est juste "x" (sans @) dans l'expression
  if (variables.x !== undefined) {
     safeExpr = safeExpr.replace(/\bx\b/g, `(${variables.x})`);
  }

  // 2. Préparer pour JS
  safeExpr = prepareForEval(safeExpr);

  try {
    // Calcul sécurisé via Function
    const fn = new Function(`return ${safeExpr}`);
    const result = fn();
    return typeof result === 'number' ? result : NaN;
  } catch (e) {
    console.warn("Erreur d'évaluation:", e);
    return NaN;
  }
};

/**
 * Alias pour évaluer une fonction f(x) en un point donné
 * (Pour compatibilité avec GraphRenderer et autres)
 */
export const evaluateAt = (expression: string, x: number): number => {
  return evaluate(expression, { x });
};

/**
 * Convertit une valeur en format LaTeX pour l'affichage (virgule décimale)
 */
export const toLatex = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Remplace le point par une virgule pour le standard mathématique français
  return str.replace('.', ',');
};

/**
 * Vérifie si la réponse utilisateur est correcte
 */
export const checkAnswer = (
  userInput: string, 
  correctAnswer: string, 
  variables: VariableValues, 
  format: 'number' | 'text' = 'number'
): boolean => {
  if (format === 'number') {
    // Évaluation numérique avec tolérance
    // On remplace la virgule par un point pour le parsing JS
    const userVal = parseFloat(userInput.replace(',', '.'));
    const expectedVal = evaluate(correctAnswer, variables);
    
    if (isNaN(userVal) || isNaN(expectedVal)) return false;
    
    // Tolérance de 0.01 pour les arrondis
    return Math.abs(userVal - expectedVal) < 0.01;
  }
  
  // Comparaison textuelle simple (nettoyée)
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return clean(userInput) === clean(correctAnswer);
};