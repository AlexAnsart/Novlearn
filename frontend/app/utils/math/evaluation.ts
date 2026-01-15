import { VariableValues } from '../../types/exercise';

/**
 * Convertit une expression LaTeX en expression JavaScript évaluable.
 * Cette fonction reprend la logique de src/utils/evaluateExpression.js
 */
const latexToJs = (latex: string): string => {
  let expr = latex;

  // 1. Nettoyage basique
  expr = expr.replace(/\\left/g, '').replace(/\\right/g, ''); // Supprime \left et \right
  expr = expr.replace(/\\,/g, '.'); // Virgule LaTeX devient point décimal
  expr = expr.replace(/,/g, '.');   // Virgule standard devient point décimal
  expr = expr.replace(/\\ /g, ' '); // Espaces forcés
  
  // 2. Constantes et Symboles
  expr = expr.replace(/\\pi/g, 'Math.PI');
  expr = expr.replace(/\\infty/g, 'Infinity');
  expr = expr.replace(/\\e/g, 'Math.E'); // Si vous utilisez \e pour Euler
  
  // 3. Opérateurs LaTeX spécifiques
  expr = expr.replace(/\\times/g, '*');
  expr = expr.replace(/\\cdot/g, '*');
  expr = expr.replace(/\\div/g, '/');

  // 4. Fractions : \frac{a}{b} -> ((a)/(b))
  // On utilise une boucle pour gérer les fractions imbriquées (simple niveau)
  while (expr.includes('\\frac')) {
    expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
  }

  // 5. Racines : \sqrt{x} -> Math.sqrt(x)
  expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, 'Math.sqrt($1)');
  
  // 6. Fonctions usuelles
  // Attention : on remplace \ln par Math.log (log naturel en JS)
  expr = expr.replace(/\\ln/g, 'Math.log');
  expr = expr.replace(/\\log/g, 'Math.log10'); // Log base 10
  expr = expr.replace(/\\exp/g, 'Math.exp');
  expr = expr.replace(/\\sin/g, 'Math.sin');
  expr = expr.replace(/\\cos/g, 'Math.cos');
  expr = expr.replace(/\\tan/g, 'Math.tan');
  expr = expr.replace(/\\abs\{([^{}]+)\}/g, 'Math.abs($1)');

  // 7. Puissances
  // a^{b} -> (a)**(b)
  expr = expr.replace(/\^\{([^{}]+)\}/g, '**($1)');
  // a^b (sans accolades, ex: x^2) -> x**2
  expr = expr.replace(/\^([0-9]+)/g, '**$1');
  // Générique (au cas où ^ reste)
  expr = expr.replace(/\^/g, '**');

  return expr;
};

/**
 * Prépare une expression brute (si ce n'est pas du LaTeX pur) pour JS
 */
const prepareForEval = (expression: string): string => {
  // Si l'expression contient des commandes LaTeX, on passe par le convertisseur
  if (expression.includes('\\')) {
    return latexToJs(expression);
  }

  // Sinon, nettoyages standards (legacy)
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
    .replace(/\be\b(?![xp])/gi, 'Math.E'); // 'e' seul (pas exp)
};

/**
 * Évalue une expression mathématique (LaTeX ou Standard) avec des variables.
 * @param expression L'expression (ex: "\frac{@a}{2}" ou "2*@a + 5")
 * @param variables Les valeurs (ex: {a: 3})
 */
export const evaluate = (expression: string, variables: VariableValues = {}): number => {
  if (!expression) return NaN;
  
  let safeExpr = expression.toString();

  // 1. Remplacer les variables @variable PAR LEUR VALEUR
  // On trie par longueur pour remplacer @alpha avant @a
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const value = variables[key];
    // On remplace @key par (value) pour sécuriser les nombres négatifs
    // Regex : @key suivi de rien ou d'un caractère non-alphanumérique (pour ne pas casser @ab)
    safeExpr = safeExpr.replace(new RegExp(`@${key}(?![a-zA-Z0-9])`, 'g'), `(${value})`);
    
    // Support legacy {key}
    safeExpr = safeExpr.replace(new RegExp(`\\{${key}\\}`, 'g'), `(${value})`);
  }
  
  // 2. Gestion de la variable implicite 'x' si fournie (pour les graphes)
  if (variables.x !== undefined) {
     safeExpr = safeExpr.replace(/\bx\b/g, `(${variables.x})`);
  }

  // 3. Conversion LaTeX -> JS
  safeExpr = prepareForEval(safeExpr);

  try {
    // Calcul sécurisé via Function
    const fn = new Function(`return ${safeExpr}`);
    const result = fn();
    return typeof result === 'number' ? result : NaN;
  } catch (e) {
    // console.warn("Erreur d'évaluation pour :", safeExpr, e);
    return NaN;
  }
};

export const evaluateAt = (expression: string, x: number): number => {
  return evaluate(expression, { x });
};

export const toLatex = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  return str.replace('.', ',');
};

/**
 * Vérifie si la réponse utilisateur est correcte.
 * Compare la valeur calculée de la réponse attendue (LaTeX) avec la saisie utilisateur.
 */
export const checkAnswer = (
  userInput: string, 
  correctAnswer: string, 
  variables: VariableValues, 
  format: 'number' | 'text' = 'number'
): boolean => {
  if (format === 'number') {
    // 1. L'élève entre "0,5" ou "1/2" -> On normalise pour JS
    const sanitizedUser = userInput.replace(',', '.');
    
    // Si l'élève entre une fraction "1/2", on l'évalue aussi
    let userVal = parseFloat(sanitizedUser);
    if (sanitizedUser.includes('/')) {
        try {
            userVal = new Function(`return ${sanitizedUser}`)();
        } catch { userVal = NaN; }
    }

    // 2. On évalue la réponse attendue (qui est souvent en LaTeX avec variables)
    // Ex: correctAnswer = "\frac{@a}{2}" avec a=1 -> devient 0.5
    const expectedVal = evaluate(correctAnswer, variables);
    
    if (isNaN(userVal) || isNaN(expectedVal)) return false;
    
    // 3. Comparaison avec tolérance (0.01)
    return Math.abs(userVal - expectedVal) < 0.01;
  }
  
  // Comparaison textuelle stricte
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return clean(userInput) === clean(correctAnswer);
};