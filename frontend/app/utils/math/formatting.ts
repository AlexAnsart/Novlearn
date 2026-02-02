/**
 * Utilitaires pour le formatage et le nettoyage des expressions mathématiques.
 * Inspiré de src/utils/mathRenderer.jsx
 */

// Formate une valeur numérique (entier ou flottant avec max 4 décimales)
export const formatValue = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const numValue = typeof value === 'number' ? value : parseFloat(value as string);
  
  if (isNaN(numValue)) return String(value);
  
  return Number.isInteger(numValue) 
    ? numValue.toString() 
    : parseFloat(numValue.toFixed(4)).toString();
};

/**
 * Nettoie et simplifie une expression mathématique (cœur de l'optimisation).
 * Gère les 0 inutiles, les signes multiples (+ -), les coefficients 1, les puissances 1, etc.
 */
export const cleanMathExpression = (expression: string): string => {
  let cleaned = expression;

  // 1. Gérer le coefficient 0 (0x, 0x^2, 0\pi...) -> devient "0"
  // Regex : 0 suivi d'une lettre ou commande
  cleaned = cleaned.replace(/(?<![\d.])0\s*[a-zA-Z\\][a-zA-Z0-9^_{}\\]*/g, '0');

  // 2. Gérer le coefficient 1 (1x -> x, 1\pi -> \pi)
  cleaned = cleaned.replace(/(?<![\d.])1\s*([a-zA-Z\\])/g, '$1');

  // 3. Gérer la puissance 1 (x^1 -> x)
  // Regex : ^1 non suivi d'un chiffre (pour ne pas casser ^10, ^12...)
  cleaned = cleaned.replace(/\^1(?![0-9])/g, '');

  // 4. NETTOYAGE DES ZÉROS
  
  // A. Zéros au MILIEU ou à la FIN (+ 0, - 0) non suivis d'un point
  cleaned = cleaned.replace(/[+-]\s*0(?![0-9.])/g, '');

  // B. Zéro au DÉBUT suivi d'un signe (0 + x -> + x)
  cleaned = cleaned.replace(/^\s*0\s*([+-])/, '$1');

  // 5. GESTION DES SIGNES (Ex: + - devient -)
  cleaned = cleaned.replace(/\+\s*-/g, '-');
  cleaned = cleaned.replace(/-\s*-/g, '+');
  cleaned = cleaned.replace(/\+\s*\+/g, '+');
  cleaned = cleaned.replace(/\+ -/g, '-');
  cleaned = cleaned.replace(/\+-/g, '-');
  cleaned = cleaned.replace(/--/g, '+');
  
  // 6. NETTOYAGE FINAL DU DÉBUT DE LIGNE
  // Enlever le "+" au tout début (ex: "+ x^2" -> "x^2")
  cleaned = cleaned.replace(/^\s*\+/, '');

  // 7. Enlever les parenthèses autour des nombres positifs isolés
  cleaned = cleaned.replace(/\((\d+\.?\d*)\)/g, '$1');

  // 8. SI TOUT EST VIDE (ex: 0x -> 0 -> vide), on remet "0"
  if (expression.trim() !== '' && cleaned.trim() === '') {
    return '0';
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
};