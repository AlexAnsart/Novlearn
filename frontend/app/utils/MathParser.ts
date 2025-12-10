/**
 * Utilitaires pour parser, convertir et évaluer les expressions mathématiques
 */

import { VariableValues } from '../types/exercise';

// ============================================
// SUBSTITUTION DES VARIABLES
// ============================================

/**
 * Substitue les variables dans un texte
 * Supporte {a}, {b} et aussi les variables directes a, b dans les expressions
 */
export function substituteVariables(
  text: string,
  variables: VariableValues,
  options: { useBraces?: boolean } = {}
): string {
  const { useBraces = true } = options;
  let result = text;

  for (const [name, value] of Object.entries(variables)) {
    // Remplace {nom_variable}
    if (useBraces) {
      const bracketPattern = new RegExp(`\\{${name}\\}`, 'g');
      result = result.replace(bracketPattern, String(value));
    }
    
    // Remplace aussi le nom seul (avec word boundaries) pour les expressions
    const wordPattern = new RegExp(`(?<![a-zA-Z])${name}(?![a-zA-Z0-9])`, 'g');
    result = result.replace(wordPattern, String(value));
  }

  return result;
}

// ============================================
// CONVERSION TEXTE → LATEX
// ============================================

/**
 * Convertit une expression mathématique simple en LaTeX
 */
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

// ============================================
// PARSING POUR AFFICHAGE
// ============================================

/**
 * Parse un texte contenant des délimiteurs math ($...$)
 * Retourne les segments avec leur type
 */
export interface TextSegment {
  type: 'text' | 'math' | 'display-math';
  content: string;
}

export function parseMathText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  
  // Regex pour trouver $$...$$ (display) et $...$ (inline)
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texte avant le match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Le match math
    const mathContent = match[0];
    if (mathContent.startsWith('$$')) {
      segments.push({
        type: 'display-math',
        content: mathContent.slice(2, -2)
      });
    } else {
      segments.push({
        type: 'math',
        content: mathContent.slice(1, -1)
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Texte restant
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return segments;
}

// ============================================
// UTILITAIRES POUR LES SUITES
// ============================================

/**
 * Calcule les termes d'une suite explicite
 */
export function computeExplicitSequence(
  formula: string,
  variables: Record<string, number>,
  count: number
): number[] {
  const terms: number[] = [];
  
  // Extrait l'expression après "="
  const exprMatch = formula.match(/=\s*(.+)$/);
  const expr = exprMatch ? exprMatch[1] : formula;

  for (let n = 0; n < count; n++) {
    const value = evaluate(expr, { ...variables, n });
    terms.push(isNaN(value) ? 0 : value);
  }

  return terms;
}

/**
 * Calcule les termes d'une suite récurrente
 */
export function computeRecursiveSequence(
  u0: number,
  relation: string,
  variables: Record<string, number>,
  count: number
): number[] {
  const terms: number[] = [u0];
  
  for (let n = 1; n < count; n++) {
    // U_{n+1} = f(U_n)
    const prevTerm = terms[n - 1];
    const value = evaluate(relation, { ...variables, n: n - 1, u: prevTerm, U: prevTerm });
    terms.push(isNaN(value) ? 0 : value);
  }

  return terms;
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Formate un nombre pour l'affichage
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Simplifie une expression (basique)
 */
export function simplifyExpression(expr: string): string {
  return expr
    .replace(/\+\s*-/g, '- ')
    .replace(/-\s*-/g, '+ ')
    .replace(/\*\s*1(?![0-9])/g, '')
    .replace(/(?<![0-9])1\s*\*/g, '')
    .replace(/\+\s*0(?![0-9])/g, '')
    .replace(/(?<![0-9])0\s*\+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}