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
  // On trie par longueur pour remplacer @alpha avant @a
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const value = variables[key];
    // Remplace @key par (value) pour sécuriser les nombres négatifs
    safeExpr = safeExpr.replace(new RegExp(`@${key}\\b`, 'g'), `(${value})`);
    // Support aussi pour {key} si jamais
    safeExpr = safeExpr.replace(new RegExp(`\\{${key}\\}`, 'g'), `(${value})`);
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