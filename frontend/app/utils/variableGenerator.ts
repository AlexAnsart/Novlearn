/**
 * Génération des variables pour les exercices
 */

import { Variable, VariableValues } from '../types/exercise';

/**
 * Génère des valeurs aléatoires pour les variables d'un exercice
 */
export function generateVariables(variables: Variable[]): VariableValues {
  const values: VariableValues = {};

  for (const variable of variables) {
    switch (variable.type) {
      case 'integer':
        values[variable.name] = randomInteger(variable.min, variable.max);
        break;

      case 'decimal':
        values[variable.name] = randomDecimal(
          variable.min,
          variable.max,
          variable.decimals
        );
        break;

      case 'choice':
        values[variable.name] = randomChoice(variable.choices);
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
  decimals: number
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
export function toNumericVariables(variables: VariableValues): Record<string, number> {
  const numeric: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'number') {
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
  fallback: number = 0
): number {
  const val = variables[name];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}