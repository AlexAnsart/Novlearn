/**
 * Utilitaires purs pour le formatage et le nettoyage des expressions mathématiques.
 * Ne contient aucune logique d'évaluation complexe.
 */

// Formate une valeur numérique (entier ou flottant avec max 4 décimales)
export const formatValue = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const numValue = typeof value === "number" ? value : parseFloat(value as string);
  
  if (isNaN(numValue)) return String(value);
  
  return Number.isInteger(numValue) 
    ? numValue.toString() 
    : parseFloat(numValue.toFixed(4)).toString();
};

/**
 * Nettoie et simplifie une expression mathématique textuelle.
 */
export const cleanMathExpression = (expression: string): string => {
  if (!expression) return "";
  let cleaned = expression.toString();

  // 1. Gérer le coefficient 0 (0x, 0*x, 0 \cdot x...) -> "0"
  // On accepte désormais les symboles de multiplication optionnels entre le 0 et la lettre
  cleaned = cleaned.replace(/(?<![\d.])0\s*(?:\*|\\cdot|\\times)?\s*[a-zA-Z\\][a-zA-Z0-9^_{}\\]*/g, "0");

  // 2. Gérer le coefficient 1 (1x, 1*x, 1 \cdot x, 1*(x) -> x)
  // On accepte les *, \cdot, \times et on inclut la parenthèse ouvrante \(
  cleaned = cleaned.replace(/(?<![\d.])1\s*(?:\*|\\cdot|\\times)?\s*([a-zA-Z\\(])/g, "$1");

  // 3. Gérer la puissance 1 (x^1 -> x)
  cleaned = cleaned.replace(/\^1(?![0-9])/g, "");

  // 4. Zéros inutiles (+ 0, - 0)
  cleaned = cleaned.replace(/[+-]\s*0(?![0-9.])/g, "");
  cleaned = cleaned.replace(/^\s*0\s*([+-])/, "$1");

  // 5. Gestion des signes multiples
  cleaned = cleaned.replace(/\+\s*-/g, "-");
  cleaned = cleaned.replace(/-\s*-/g, "+");
  cleaned = cleaned.replace(/\+\s*\+/g, "+");
  cleaned = cleaned.replace(/\+ -/g, "-");
  cleaned = cleaned.replace(/\+-/g, "-");
  cleaned = cleaned.replace(/--/g, "+");
  
  // 6. Nettoyage final du début de ligne
  cleaned = cleaned.replace(/^\s*\+/, "");

  if (expression.trim() !== "" && cleaned.trim() === "") return "0";
  
  return cleaned.replace(/\s+/g, " ").trim();
};