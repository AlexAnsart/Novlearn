import { parse, simplify } from "mathjs";
import { VariableValues } from "../../types/exercise";
import { toMathJsSyntax } from "./evaluation"; // Assurez-vous que cette fonction est exportée dans evaluation.ts !

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

  try {
    // 2. Nettoyage des $ (si présents) pour le calcul
    safeExpr = safeExpr.replace(/\$/g, "");

    // 3. Conversion en syntaxe MathJS
    const mathJsSyntax = toMathJsSyntax(safeExpr);

    // 4. Simplification Symbolique
    // C'est ici que la magie opère :
    // "8/2 * x" devient "4 * x"
    // "4 * x" reste "4 * x"
    const node = parse(mathJsSyntax);
    const simplifiedNode = simplify(node);

    // 5. Retour en LaTeX
    let resultLatex = simplifiedNode.toTex();

    // 6. Nettoyage cosmétique final
    // Uniformiser la multiplication en * (étoile)
    resultLatex = resultLatex.replace(/\\cdot/g, " * ");
    resultLatex = resultLatex.replace(/\\times/g, " * ");
    resultLatex = resultLatex.replace(/~/g, " "); // Enlève les espaces insécables parfois ajoutés
    // Nettoie les espaces multiples
    resultLatex = resultLatex.replace(/\s+/g, " ").trim();

    return resultLatex;
  } catch (e) {
    // Si l'expression est trop complexe ou invalide, on renvoie la version substituée brute
    return safeExpr;
  }
};
