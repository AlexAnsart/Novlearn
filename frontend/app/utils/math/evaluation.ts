import { evaluate as mathEvaluate } from 'mathjs';
import { VariableValues } from '../../types/exercise';

// ==========================================
// 1. TRADUCTEUR UNIVERSEL (Texte/LaTeX -> Math.js)
// ==========================================

const toMathJsSyntax = (expression: string): string => {
  if (!expression) return '';
  let expr = expression;

  // 1. Nettoyage
  expr = expr.replace(/\\ /g, ' '); 
  expr = expr.replace(/\\left/g, ''); 
  expr = expr.replace(/\\right/g, ''); 
  expr = expr.replace(/\\displaystyle/g, '');
  expr = expr.replace(/,/g, '.');
  expr = expr.replace(/\\,/g, '.');

  // 2. INFINI (Le point critique pour les limites)
  // \infty -> Infinity
  expr = expr.replace(/\\infty/g, 'Infinity');
  // +Infinity est valide en JS, mais on nettoie au cas où
  expr = expr.replace(/\+\s*Infinity/g, 'Infinity'); 

  // 3. Constantes
  expr = expr.replace(/\\pi/g, 'pi');
  // 'e' isolé seulement (pas exp)
  expr = expr.replace(/\\e/g, 'e');
  expr = expr.replace(/\be\b(?![xp])/g, 'e'); 

  // 4. Opérateurs
  expr = expr.replace(/\\times/g, '*');
  expr = expr.replace(/\\cdot/g, '*');
  expr = expr.replace(/\\div/g, '/');
  expr = expr.replace(/:/g, '/');

  // 5. FONCTIONS 
  // A. Log Décimal (D'ABORD)
  expr = expr.replace(/\\log/g, 'log10');
  expr = expr.replace(/\blog\b/g, 'log10');

  // B. Log Népérien (ENSUITE)
  expr = expr.replace(/\\ln/g, 'log');
  expr = expr.replace(/\bln\b/g, 'log');

  // C. Autres
  expr = expr.replace(/\\exp/g, 'exp');
  expr = expr.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, 'nthRoot($2, $1)'); 
  expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)'); 
  ['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'abs'].forEach(fn => {
    expr = expr.replace(new RegExp(`\\\\${fn}`, 'g'), fn);
  });

  // 6. Puissances
  expr = expr.replace(/\^\{([^{}]+)\}/g, '^($1)');

  // 7. Fractions
  let prevExpr = '';
  while (expr !== prevExpr) {
    prevExpr = expr;
    expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
  }

  // 8. Multiplication Implicite
  expr = expr.replace(/(\d)\s*([a-zA-Z])/g, '$1*$2');
  expr = expr.replace(/(\d)\s*\(/g, '$1*(');
  expr = expr.replace(/\)\s*([a-zA-Z])/g, ')*$1');
  expr = expr.replace(/\)\s*\(/g, ')*(');

  return expr;
};

// ==========================================
// 2. MOTEUR D'ÉVALUATION
// ==========================================

export const evaluate = (expression: string, variables: VariableValues = {}): number => {
  if (!expression) return NaN;
  
  let safeExpr = expression.toString();

  // 1. Remplacement des variables
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const value = variables[key];
    safeExpr = safeExpr.replace(new RegExp(`@${key}(?![a-zA-Z0-9])`, 'g'), `(${value})`);
    safeExpr = safeExpr.replace(new RegExp(`\\{${key}\\}`, 'g'), `(${value})`);
  }

  // 2. Conversion
  const mathJsExpr = toMathJsSyntax(safeExpr);

  try {
    const scope = variables.x !== undefined ? { x: Number(variables.x) } : {};
    const result = mathEvaluate(mathJsExpr, scope);
    
    // CAS SPÉCIAL INFINI : MathJS renvoie Infinity, ce qui est un "number" en JS
    if (result === Infinity || result === -Infinity) return result;

    if (typeof result === 'object' && 're' in result) return NaN;
    if (!isFinite(result)) return NaN; // NaN ou autres erreurs
    
    return Number(result);
  } catch (e) {
    return NaN;
  }
};

// ==========================================
// 3. VÉRIFICATION AVANCÉE (Avec gestion Infinity)
// ==========================================

export const checkAnswer = (
  userInput: string, 
  correctAnswer: string, 
  variables: VariableValues, 
  format: 'number' | 'text' = 'number'
): boolean => {
  if (format === 'text') {
    return userInput.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }

  // 1. Calcul des valeurs
  const expectedVal = evaluate(correctAnswer, variables);
  const userVal = evaluate(userInput, variables);

  // Si l'un des deux est invalide (NaN), c'est faux direct
  if (isNaN(expectedVal) || isNaN(userVal)) return false;

  // --- GESTION SPÉCIALE INFINI ---
  // On vérifie d'abord si la réponse attendue est infinie
  if (!isFinite(expectedVal)) {
    // Si attendu = +Infinity, l'utilisateur DOIT avoir +Infinity
    // Si attendu = -Infinity, l'utilisateur DOIT avoir -Infinity
    return userVal === expectedVal;
  }
  
  // Si l'utilisateur répond Infini alors qu'on attend un nombre fini -> Faux
  if (!isFinite(userVal)) {
    return false;
  }

  // --- COMPARAISON CLASSIQUE (Nombres Finis) ---
  const TOLERANCE = 0.0001;
  if (Math.abs(userVal - expectedVal) < TOLERANCE) return true;

  // --- MODE FONCTION (Seulement si tout est fini) ---
  // Test avec x aléatoire
  const testX = 1.618;
  const varsWithX = { ...variables, x: testX };
  const expectedFunc = evaluate(correctAnswer, varsWithX);
  const userFunc = evaluate(userInput, varsWithX);

  if (!isNaN(expectedFunc) && !isNaN(userFunc) && isFinite(expectedFunc) && isFinite(userFunc)) {
    return Math.abs(userFunc - expectedFunc) < TOLERANCE;
  }

  return false;
};

export const toLatex = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  // Si c'est infini, on retourne le symbole LaTeX
  if (value === Infinity) return '+\\infty';
  if (value === -Infinity) return '-\\infty';
  return String(value).replace('.', ',');
};