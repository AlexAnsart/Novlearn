export function toLatex(expression: string): string {
  let latex = expression;

  // Fractions: a/b → \frac{a}{b}
  latex = latex.replace(/(\d+|\([^)]+\)|[a-zA-Z])\s*\/\s*(\d+|\([^)]+\)|[a-zA-Z])/g, '\\frac{$1}{$2}');

  // Puissances: x^2 → x^{2}, x^{12} → x^{12}
  latex = latex.replace(/\^(\d+)/g, '^{$1}');
  latex = latex.replace(/\^\(([^)]+)\)/g, '^{$1}');

  // Racines carrées: sqrt(x) → \sqrt{x}
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

  // Fonctions trigonométriques et autres
  latex = latex.replace(/\bsin\b/g, '\\sin');
  latex = latex.replace(/\bcos\b/g, '\\cos');
  latex = latex.replace(/\btan\b/g, '\\tan');
  latex = latex.replace(/\bln\b/g, '\\ln');
  latex = latex.replace(/\blog\b/g, '\\log');
  latex = latex.replace(/\bexp\b/g, '\\exp');
  latex = latex.replace(/\blim\b/g, '\\lim');

  // Symboles spéciaux
  latex = latex.replace(/\*\s*/g, ' \\cdot ');
  latex = latex.replace(/pi/gi, '\\pi');
  latex = latex.replace(/-inf|−∞|-∞/gi, '-\\infty');
  latex = latex.replace(/\+inf|\+∞/gi, '+\\infty');
  latex = latex.replace(/(?<![+-])inf|(?<![+-])∞/gi, '\\infty');
  
  // Comparaisons
  latex = latex.replace(/>=|≥/g, '\\geq ');
  latex = latex.replace(/<=|≤/g, '\\leq ');
  latex = latex.replace(/!=/g, '\\neq ');

  // Intervalles
  latex = latex.replace(/\]-/g, '\\left]-');
  latex = latex.replace(/-\[/g, '-\\right[');
  latex = latex.replace(/\[-/g, '\\left[-');
  latex = latex.replace(/-\]/g, '-\\right]');

  // Indices: U_n → U_{n}
  latex = latex.replace(/([A-Za-z])_([a-zA-Z0-9])/g, '$1_{$2}');
  latex = latex.replace(/([A-Za-z])_\{([^}]+)\}/g, '$1_{$2}');

  return latex;
}

/**
 * Convertit du LaTeX vers une expression calculable
 */
export function fromLatex(latex: string): string {
  let expr = latex;

  // \frac{a}{b} → (a)/(b)
  expr = expr.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

  // \sqrt{x} → sqrt(x)
  expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');

  // Puissances: ^{2} → ^(2)
  expr = expr.replace(/\^\{([^}]+)\}/g, '^($1)');

  // Fonctions
  expr = expr.replace(/\\sin/g, 'sin');
  expr = expr.replace(/\\cos/g, 'cos');
  expr = expr.replace(/\\tan/g, 'tan');
  expr = expr.replace(/\\ln/g, 'ln');
  expr = expr.replace(/\\log/g, 'log');
  expr = expr.replace(/\\exp/g, 'exp');

  // Symboles
  expr = expr.replace(/\\cdot/g, '*');
  expr = expr.replace(/\\pi/g, 'pi');
  expr = expr.replace(/\\infty/g, 'Infinity');
  expr = expr.replace(/\\times/g, '*');

  // Nettoyage
  expr = expr.replace(/\\left|\\right/g, '');
  expr = expr.replace(/\s+/g, '');

  return expr;
}

// ============================================
// ÉVALUATION DES EXPRESSIONS
// ============================================

/**
 * Évalue une expression mathématique pour x donné
 */
export function evaluateAt(expression: string, x: number): number {
  const safeExpr = prepareForEval(expression);
  
  try {
    const fn = new Function('x', `return ${safeExpr}`);
    const result = fn(x);
    return typeof result === 'number' ? result : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Évalue une expression avec plusieurs variables
 */
export function evaluate(
  expression: string,
  variables: Record<string, number>
): number {
  let safeExpr = prepareForEval(expression);

  // Substitue les variables
  for (const [name, value] of Object.entries(variables)) {
    const pattern = new RegExp(`(?<![a-zA-Z])${name}(?![a-zA-Z0-9])`, 'g');
    safeExpr = safeExpr.replace(pattern, `(${value})`);
  }

  try {
    const fn = new Function(`return ${safeExpr}`);
    const result = fn();
    return typeof result === 'number' ? result : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Prépare une expression pour l'évaluation JavaScript
 */
function prepareForEval(expression: string): string {
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
    .replace(/\be\b(?![xp])/gi, 'Math.E')
    .replace(/\bInfinity\b/g, 'Infinity');
}