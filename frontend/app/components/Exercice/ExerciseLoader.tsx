import React, { useState, useEffect, useCallback } from 'react';
import { Exercise, VariableValues } from '../../types/exercise';
import { generateVariables } from '../../utils/variableGenerator';
import ExerciseRenderer from './ExerciseRenderer';

interface ExerciseLoaderProps {
  /** ID ou nom du fichier de l'exercice (sans extension) */
  exerciseId?: string;
  /** Exercice déjà chargé (optionnel) */
  exercise?: Exercise;
  /** Chemin vers le dossier des exercices */
  dataPath?: string;
  /** Callback quand l'exercice est chargé */
  onLoad?: (exercise: Exercise) => void;
  /** Callback quand un élément interactif est soumis */
  onElementSubmit?: (elementId: number, answer: unknown, isCorrect: boolean) => void;
  /** Callback pour erreur de chargement */
  onError?: (error: Error) => void;
}

/**
 * Composant pour charger et afficher un exercice depuis un fichier JSON
 */
export const ExerciseLoader: React.FC<ExerciseLoaderProps> = ({
  exerciseId,
  exercise: providedExercise,
  dataPath = '/data',
  onLoad,
  onElementSubmit,
  onError,
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(providedExercise || null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [loading, setLoading] = useState(!providedExercise && !!exerciseId);
  const [error, setError] = useState<string | null>(null);

  // Charge l'exercice depuis le fichier JSON
  useEffect(() => {
    if (providedExercise) {
      setExercise(providedExercise);
      setVariables(generateVariables(providedExercise.variables));
      onLoad?.(providedExercise);
      return;
    }

    if (!exerciseId) return;

    const loadExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${dataPath}/${exerciseId}.json`);
        
        if (!response.ok) {
          throw new Error(`Exercice non trouvé: ${exerciseId}`);
        }

        const data: Exercise = await response.json();
        setExercise(data);
        setVariables(generateVariables(data.variables));
        onLoad?.(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [exerciseId, providedExercise, dataPath, onLoad, onError]);

  // Régénère les variables
  const handleRegenerate = useCallback(() => {
    if (exercise) {
      setVariables(generateVariables(exercise.variables));
    }
  }, [exercise]);

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p 
            className="text-gray-600"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Chargement de l'exercice...
          </p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="p-5 bg-red-50 rounded-2xl border border-red-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p 
              className="text-red-800 font-semibold"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Erreur de chargement
            </p>
            <p 
              className="text-red-600 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pas d'exercice
  if (!exercise) {
    return (
      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
        <p 
          className="text-gray-500 text-center"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          Aucun exercice à afficher
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec titre et bouton régénérer */}
      <div className="flex items-center justify-between">
        <h2 
          className="text-2xl text-gray-800 font-semibold"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          {exercise.title}
        </h2>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white
                     bg-gradient-to-b from-purple-500 to-purple-700
                     shadow-[0_3px_0_#6b21a8,0_4px_8px_rgba(147,51,234,0.3)]
                     hover:translate-y-[-1px] hover:shadow-[0_4px_0_#6b21a8,0_6px_12px_rgba(147,51,234,0.4)]
                     active:translate-y-[1px] active:shadow-[0_2px_0_#6b21a8,0_3px_6px_rgba(147,51,234,0.3)]
                     transition-all duration-200"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
          title="Régénérer les variables"
        >
          🔄 Nouvelles valeurs
        </button>
      </div>

      {/* Chapitre */}
      <p 
        className="text-gray-500"
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        {exercise.chapter}
      </p>

      {/* Rendu de l'exercice */}
      <ExerciseRenderer
        exercise={exercise}
        preGeneratedVariables={variables}
        onElementSubmit={onElementSubmit}
      />
    </div>
  );
};

export default ExerciseLoader;