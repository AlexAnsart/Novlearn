import React, { useCallback, useEffect, useState, useRef } from "react";
import { Exercise, VariableValues } from "../../types/exercise";
import { generateVariables } from "../../utils/variableGenerator";
import ExerciseRenderer from "./ExerciseRenderer";
import { supabase } from "../../lib/supabase";

interface ExerciseLoaderProps {
  exerciseId?: string;
  onLoad?: (exercise: Exercise) => void;
  onElementSubmit?: (elementId: number, answer: unknown, isCorrect: boolean) => void;
  onError?: (error: Error) => void;
}

export const ExerciseLoader: React.FC<ExerciseLoaderProps> = ({
  exerciseId,
  onLoad,
  onElementSubmit,
  onError,
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  
  const [loading, setLoading] = useState(true);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs pour gérer le cycle de vie sans déclencher de re-renders inutiles
  const abortControllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null); // <-- CORRECTION ICI

  useEffect(() => {
    // 1. Nettoyage préventif de l'effet précédent
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }

    // 2. Initialisation pour la nouvelle requête
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadExercise = async () => {
      setLoading(true);
      setError(null);
      setIsTakingLong(false);

      // Timer pour afficher le message "patientez..." après 3s
      slowTimerRef.current = setTimeout(() => {
        if (!abortController.signal.aborted) {
          setIsTakingLong(true);
        }
      }, 3000);

      try {
        let query = supabase.from("exercises").select("*");

        if (exerciseId) {
          query = query.eq("id", exerciseId);
        } else {
          query = query.limit(1);
        }

        // On laisse Supabase gérer la connexion sans timeout manuel agressif
        const { data, error: dbError } = await query.maybeSingle();

        // Si on arrive ici, la requête a abouti, on nettoie le timer de "lenteur"
        if (slowTimerRef.current) {
          clearTimeout(slowTimerRef.current);
          slowTimerRef.current = null;
        }

        if (abortController.signal.aborted) return;

        if (dbError) throw dbError;

        if (!data) {
          throw new Error("Exercice introuvable ou inexistant.");
        }

        // Reconstruction de l'objet Exercise
        const content = data.content || {};
        
        const fullExercise = {
          ...content, 
          id: data.id,
          title: data.title,
          chapter: data.chapter,
          difficulty: data.difficulty,
          competences: data.competences || [],
          variables: content.variables || [],
          elements: content.elements || [],
        } as unknown as Exercise;

        setExercise(fullExercise);
        setVariables(generateVariables(fullExercise.variables));
        
        if (onLoad) onLoad(fullExercise);

      } catch (err) {
        if (abortController.signal.aborted) return;
        
        console.error("[ExerciseLoader] Erreur:", err);
        const errorMessage = err instanceof Error ? err.message : "Erreur de chargement";
        
        setError(errorMessage);
        if (onError) onError(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsTakingLong(false);
          // Nettoyage final du timer par sécurité
          if (slowTimerRef.current) {
            clearTimeout(slowTimerRef.current);
            slowTimerRef.current = null;
          }
        }
      }
    };

    loadExercise();

    // 3. Fonction de nettoyage appelée quand le composant est démonté ou si exerciseId change
    return () => {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current); // <-- Maintenant ça marche car on utilise la ref
      }
      abortController.abort();
    };
  }, [exerciseId]); // onLoad et onError sont exclus pour éviter les boucles, mais c'est ok car ils sont stables généralement

  const handleRegenerate = useCallback(() => {
    if (exercise) {
      setVariables(generateVariables(exercise.variables));
    }
  }, [exercise]);

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Chargement de l'exercice...</p>
        
        {isTakingLong && (
          <p className="text-sm text-gray-400 mt-2 animate-pulse text-center max-w-md">
            La base de données s'éveille, cela peut prendre encore quelques secondes...
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center bg-red-50 border border-red-100 rounded-xl min-h-[300px]">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-red-800 font-bold text-lg mb-2">Impossible de charger l'exercice</h3>
        <p className="text-red-600 mb-6 max-w-sm">{error}</p>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            window.location.reload(); 
          }}
          className="px-5 py-2 bg-white border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-50 transition shadow-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">{exercise.title}</h2>
          <div className="flex gap-2 text-sm text-gray-500">
            {exercise.chapter && (
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase tracking-wide font-semibold">
                {exercise.chapter}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
              exercise.difficulty === 'Difficile' ? 'bg-red-50 text-red-700' :
              exercise.difficulty === 'Moyen' ? 'bg-yellow-50 text-yellow-700' :
              'bg-green-50 text-green-700'
            }`}>
              {exercise.difficulty}
            </span>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Nouvelles valeurs
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
        <ExerciseRenderer
          exercise={exercise}
          preGeneratedVariables={variables}
          onElementSubmit={onElementSubmit}
        />
      </div>
    </div>
  );
};

export default ExerciseLoader;