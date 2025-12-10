import { useState, useCallback, useMemo } from 'react';
import { Variable, VariableValues } from '../types/exercise';
import { generateVariables, toNumericVariables, getNumericValue } from '../utils/variableGenerator';

/**
 * Hook pour gérer les variables d'un exercice
 */
export function useVariables(variables: Variable[]) {
  const [values, setValues] = useState<VariableValues>(() =>
    generateVariables(variables)
  );

  // Régénère toutes les variables
  const regenerate = useCallback(() => {
    setValues(generateVariables(variables));
  }, [variables]);

  // Récupère une valeur de variable
  const getValue = useCallback(
    (name: string): number | string | undefined => {
      return values[name];
    },
    [values]
  );

  // Récupère uniquement les valeurs numériques
  const numericValues = useMemo(() => 
    toNumericVariables(values),
    [values]
  );

  // Récupère une valeur numérique (avec fallback)
  const getNumeric = useCallback(
    (name: string, fallback: number = 0): number => {
      return getNumericValue(values, name, fallback);
    },
    [values]
  );

  // Récupère une valeur string
  const getString = useCallback(
    (name: string, fallback: string = ''): string => {
      const val = values[name];
      return val !== undefined ? String(val) : fallback;
    },
    [values]
  );

  return {
    values,
    numericValues,
    regenerate,
    getValue,
    getNumeric,
    getString,
    setValues,
  };
}

export default useVariables;