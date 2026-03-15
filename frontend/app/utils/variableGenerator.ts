/**
 * Génération des variables pour les exercices
 */

import { Variable, VariableValues } from "../types/exercise";
import { evaluate } from "./math/evaluation";

/**
 * Évalue une exclusion (peut être un nombre ou une expression avec variables)
 */
function evaluateExclusion(
  exclusion: string | number,
  currentValues: VariableValues,
): number | null {
  if (typeof exclusion === "number") {
    return exclusion;
  }

  // Si c'est une chaîne, essayer de l'évaluer comme expression
  try {
    const numericValues: Record<string, number> = {};
    for (const [name, value] of Object.entries(currentValues)) {
      const numValue =
        typeof value === "number" ? value : parseFloat(String(value));
      if (!isNaN(numValue)) {
        numericValues[name] = numValue;
      }
    }

    // Résoudre la syntaxe @variable (ex: "@a", "@a + 1")
    const sortedKeys = Object.keys(numericValues).sort(
      (a, b) => b.length - a.length,
    );
    let resolvedExclusion = exclusion;
    for (const key of sortedKeys) {
      resolvedExclusion = resolvedExclusion.replace(
        new RegExp(`@${key}(?![a-zA-Z0-9])`, "g"),
        String(numericValues[key]),
      );
    }
    // Si des @variable n'ont pas pu être résolues, abandonner
    if (resolvedExclusion.includes("@")) return null;

    const result = evaluate(resolvedExclusion, numericValues);
    if (!isNaN(result) && isFinite(result)) {
      return result;
    }
  } catch {
    // Si l'évaluation échoue (variable pas encore définie), retourner null
  }

  return null;
}

/**
 * Vérifie si une valeur est exclue
 */
function isValueExcluded(
  value: number,
  exclusions: (string | number)[] | undefined,
  currentValues: VariableValues,
): boolean {
  if (!exclusions || exclusions.length === 0) return false;

  for (const exclusion of exclusions) {
    const excludedValue = evaluateExclusion(exclusion, currentValues);
    if (excludedValue !== null && Math.abs(value - excludedValue) < 0.0001) {
      return true;
    }
  }

  return false;
}

/**
 * Génère un entier aléatoire en évitant les exclusions
 */
function generateIntegerWithExclusions(
  min: number,
  max: number,
  exclusions: (string | number)[] | undefined,
  currentValues: VariableValues,
  maxAttempts: number = 100,
): number {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const value = randomInteger(min, max);
    if (!isValueExcluded(value, exclusions, currentValues)) {
      return value;
    }
  }
  // Fallback: retourner une valeur même si elle est exclue (éviter boucle infinie)
  console.warn(
    `Could not find non-excluded value after ${maxAttempts} attempts`,
  );
  return randomInteger(min, max);
}

/**
 * Génère un décimal aléatoire en évitant les exclusions
 */
function generateDecimalWithExclusions(
  min: number,
  max: number,
  decimals: number,
  exclusions: (string | number)[] | undefined,
  currentValues: VariableValues,
  maxAttempts: number = 100,
): number {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const value = randomDecimal(min, max, decimals);
    if (!isValueExcluded(value, exclusions, currentValues)) {
      return value;
    }
  }
  console.warn(
    `Could not find non-excluded decimal after ${maxAttempts} attempts`,
  );
  return randomDecimal(min, max, decimals);
}

/**
 * Évalue une expression de variable computed en parenthésant toutes les valeurs.
 * Évite le piège -8^2 = -64 (au lieu de (-8)^2 = 64) causé par substituteVariables
 * qui retourne -8 sans parenthèses pour l'affichage.
 */
function evaluateComputedExpression(
  expr: string,
  vars: Record<string, number>,
): number {
  const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);
  let safeExpr = expr;
  for (const key of sortedKeys) {
    safeExpr = safeExpr.replace(
      new RegExp(`@${key}(?![a-zA-Z0-9])`, "g"),
      `(${vars[key]})`,
    );
  }
  return evaluate(safeExpr, {});
}

/**
 * Parse une chaîne de n-uplets "(1,2); (-1,3)" et retourne un n-uplet au hasard.
 * Retourne null si le parsing échoue ou si aucun n-uplet ne correspond à `expected`.
 */
function parseTupleChoices(raw: string, expected: number): number[] | null {
  const tuples = raw
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/^\(|\)$/g, ""))
    .map((s) => s.split(",").map((v) => parseFloat(v.trim())))
    .filter((arr) => arr.length === expected && arr.every((n) => !isNaN(n)));

  if (tuples.length === 0) return null;
  return randomChoice(tuples);
}

/**
 * Génère des valeurs aléatoires pour les variables d'un exercice
 * Gère aussi les variables calculées (computed) et les exclusions
 */
export function generateVariables(variables: Variable[]): VariableValues {
  const values: VariableValues = {};

  // First pass: generate random values for non-computed variables
  for (const variable of variables) {
    if (variable.type === "computed") {
      continue; // Skip computed variables for now
    }

    switch (variable.type) {
      case "integer":
        if (variable.min !== undefined && variable.max !== undefined) {
          values[variable.name] = generateIntegerWithExclusions(
            variable.min,
            variable.max,
            variable.exclusions,
            values,
          );
        }
        break;

      case "decimal":
        if (
          variable.min !== undefined &&
          variable.max !== undefined &&
          variable.decimals !== undefined
        ) {
          values[variable.name] = generateDecimalWithExclusions(
            variable.min,
            variable.max,
            variable.decimals,
            variable.exclusions,
            values,
          );
        }
        break;

      case "choice":
        if (Array.isArray(variable.choices) && variable.choices.length > 0) {
          // Pour choice, filtrer les choix exclus
          const availableChoices = variable.choices.filter((choice) => {
            const numValue = parseFloat(choice);
            if (!isNaN(numValue)) {
              return !isValueExcluded(numValue, variable.exclusions, values);
            }
            return true; // Garder les choix non-numériques
          });

          if (availableChoices.length > 0) {
            values[variable.name] = randomChoice(availableChoices);
          } else {
            values[variable.name] = randomChoice(variable.choices as string[]);
          }
        }
        break;

      case "doublet": {
        const rawD =
          typeof variable.choices === "string" ? variable.choices : undefined;
        if (variable.mode === "choice" && rawD && variable.names?.length === 2) {
          const picked = parseTupleChoices(rawD, 2);
          if (picked) {
            values[variable.names[0]] = picked[0];
            values[variable.names[1]] = picked[1];
          }
        }
        break;
      }

      case "triplet": {
        const rawT =
          typeof variable.choices === "string" ? variable.choices : undefined;
        if (variable.mode === "choice" && rawT && variable.names?.length === 3) {
          const picked = parseTupleChoices(rawT, 3);
          if (picked) {
            values[variable.names[0]] = picked[0];
            values[variable.names[1]] = picked[1];
            values[variable.names[2]] = picked[2];
          }
        } else if (
          variable.mode === "perfect_square" &&
          variable.min !== undefined &&
          variable.max !== undefined &&
          variable.names?.length === 3
        ) {
          const excl = Array.isArray(variable.exclusions)
            ? variable.exclusions
            : variable.exclusions
              ? [variable.exclusions]
              : undefined;
          const p = generateIntegerWithExclusions(
            variable.min,
            variable.max,
            excl,
            values,
          );
          const q = generateIntegerWithExclusions(
            variable.min,
            variable.max,
            excl,
            values,
          );
          values[variable.names[0]] = p * p;      // A = p²
          values[variable.names[1]] = 2 * p * q;  // B = 2pq
          values[variable.names[2]] = q * q;      // C = q²
        }
        break;
      }
    }
  }

  // Second pass: calculate computed variables
  // We may need multiple passes if computed variables depend on each other
  let computedCount = 0;
  const maxIterations = 10; // Safety limit

  while (
    computedCount < variables.filter((v) => v.type === "computed").length &&
    computedCount < maxIterations
  ) {
    let foundNew = false;

    for (const variable of variables) {
      if (
        variable.type === "computed" &&
        variable.expression &&
        !(variable.name in values)
      ) {
        try {
          // Convert current values to numeric for evaluation
          const numericValues: Record<string, number> = {};
          for (const [name, value] of Object.entries(values)) {
            const numValue =
              typeof value === "number" ? value : parseFloat(String(value));
            if (!isNaN(numValue)) {
              numericValues[name] = numValue;
            }
          }

          // Evaluate the expression (parenthèses autour des valeurs pour éviter -8^2 = -64)
          const result = evaluateComputedExpression(variable.expression, numericValues);

          if (!isNaN(result) && isFinite(result)) {
            values[variable.name] = result;
            foundNew = true;
            computedCount++;
          }
        } catch (e) {
          console.error(`Error computing variable ${variable.name}:`, e);
        }
      }
    }

    if (!foundNew) {
      // No new computed variables could be calculated, break to avoid infinite loop
      break;
    }
  }

  return values;
}

/**
 * Génère un entier aléatoire entre min et max (inclus)
 */
export function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Génère un décimal aléatoire entre min et max avec un nombre de décimales
 */
export function randomDecimal(
  min: number,
  max: number,
  decimals: number,
): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

/**
 * Choisit un élément aléatoire dans un tableau
 */
export function randomChoice<T>(choices: T[]): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Convertit les variables en valeurs numériques uniquement
 */
export function toNumericVariables(
  variables: VariableValues,
): Record<string, number> {
  const numeric: Record<string, number> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === "number") {
      numeric[key] = value;
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        numeric[key] = parsed;
      }
    }
  }

  return numeric;
}

/**
 * Récupère une valeur numérique avec fallback
 */
export function getNumericValue(
  variables: VariableValues,
  name: string,
  fallback: number = 0,
): number {
  const val = variables[name];
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}
