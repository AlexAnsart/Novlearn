/**
 * Génération des variables pour les exercices
 */

import { Variable, VariableValues } from '../types/exercise';
import { evaluate } from './math/evaluation';

/**
 * Génère des valeurs aléatoires pour les variables d'un exercice
 * Gère aussi les variables calculées (computed)
 */
export function generateVariables(variables: Variable[]): VariableValues {
  const values: VariableValues = {};

  // First pass: generate random values for non-computed variables
  for (const variable of variables) {
    if (variable.type === 'computed') {
      continue; // Skip computed variables for now
    }

    switch (variable.type) {
      case 'integer':
        if (variable.min !== undefined && variable.max !== undefined) {
          values[variable.name] = randomInteger(variable.min, variable.max);
        }
        break;

      case 'decimal':
        if (
          variable.min !== undefined &&
          variable.max !== undefined &&
          variable.decimals !== undefined
        ) {
          values[variable.name] = randomDecimal(
            variable.min,
            variable.max,
            variable.decimals
          );
        }
        break;

      case 'choice':
        if (variable.choices && variable.choices.length > 0) {
          values[variable.name] = randomChoice(variable.choices);
        }
        break;
    }
  }

  // Second pass: calculate computed variables
  // We may need multiple passes if computed variables depend on each other
  let computedCount = 0;
  const maxIterations = 10; // Safety limit
  
  while (computedCount < variables.filter(v => v.type === 'computed').length && computedCount < maxIterations) {
    let foundNew = false;
    
    for (const variable of variables) {
      if (variable.type === 'computed' && variable.expression && !(variable.name in values)) {
        try {
          // Convert current values to numeric for evaluation
          const numericValues: Record<string, number> = {};
          for (const [name, value] of Object.entries(values)) {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value));
            if (!isNaN(numValue)) {
              numericValues[name] = numValue;
            }
          }
          
          // Evaluate the expression
          const result = evaluate(variable.expression, numericValues);
          
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