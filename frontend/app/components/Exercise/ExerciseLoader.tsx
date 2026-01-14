import React, { useCallback, useEffect, useState, useRef } from "react";
import { Exercise, VariableValues, Variable, ExerciseElement } from "../../types/exercise";
import { generateVariables } from "../../utils/variableGenerator";
import ExerciseRenderer from "./ExerciseRenderer";
import { supabase } from "../../lib/supabase";

interface ExerciseLoaderProps {
  exerciseId?: string;
  onLoad?: (exercise: Exercise) => void;
  onElementSubmit?: (elementId: number, answer: unknown, isCorrect: boolean) => void;
  onError?: (error: Error) => void;
}

// Helper function for structured logging - only log important events
const log = (action: string, data?: any) => {
  // Only log errors and important state changes
  if (action.includes("ERROR") || action.includes("TIMEOUT") || action.includes("error") || action.includes("aborted")) {
    console.log(`[ExerciseLoader] ${action}`, data || '');
  }
};

export const ExerciseLoader: React.FC<ExerciseLoaderProps> = ({
  exerciseId,
  onLoad,
  onElementSubmit,
  onError,
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Charge l'exercice depuis Supabase
  useEffect(() => {
    // Ne rien faire si déjà en cours de chargement
    if (loading && requestIdRef.current) {
      return;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    requestIdRef.current = requestId;
    isMountedRef.current = true;

    // Créer un AbortController pour cette requête
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadExercise = async () => {
      // Vérifier si la requête a été annulée avant de commencer
      if (abortController.signal.aborted) {
        return;
      }

      const startTime = Date.now();
      
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Timeout de sécurité : si la requête prend plus de 20 secondes, on arrête le loading
      timeoutRef.current = setTimeout(() => {
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }
        const elapsed = Date.now() - startTime;
        log("TIMEOUT DETECTED", { exerciseId, elapsedMs: elapsed });
        if (isMountedRef.current) {
          setLoading(false);
          const timeoutError = new Error("La connexion à la base de données a pris trop de temps. Vérifiez votre connexion internet et réessayez.");
          setError(timeoutError.message);
          onError?.(timeoutError);
        }
      }, 20000);

      try {
        let query = supabase.from("exercises").select("*");

        if (exerciseId) {
          query = query.eq("id", exerciseId);
        } else {
          query = query.limit(1);
        }

        const queryStartTime = Date.now();

        // Vérifier si annulé avant d'exécuter la requête
        if (abortController.signal.aborted) {
          return;
        }

        // Créer une promesse avec timeout pour détecter les requêtes bloquées
        const queryPromise = query.maybeSingle();
        
        // Timeout pour la requête Supabase elle-même (10 secondes)
        const queryTimeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((resolve) => {
          setTimeout(() => {
            resolve({
              data: null,
              error: {
                message: "La connexion à la base de données a pris trop de temps. Vérifiez votre connexion internet.",
                code: "TIMEOUT"
              }
            });
          }, 10000);
        });

        // Utilisation de maybeSingle avec timeout
        const result = await Promise.race([queryPromise, queryTimeoutPromise]);
        const { data, error: dbError } = result;

        // Vérifier si annulé après la requête OU si ce n'est plus la requête active
        if (abortController.signal.aborted || !isMountedRef.current || requestIdRef.current !== requestId) {
          log("Request aborted after query, ignoring result", { 
            exerciseId,
            isAborted: abortController.signal.aborted,
            requestIdMismatch: requestIdRef.current !== requestId
          });
          return;
        }

        const queryDuration = Date.now() - queryStartTime;

        if (dbError) {
          log("Supabase query ERROR", { 
            error: dbError.message,
            code: dbError.code,
            queryDurationMs: queryDuration
          });
          
          // Si c'est un timeout, créer une erreur plus claire
          if (dbError.code === "TIMEOUT" || dbError.message?.includes("timeout") || dbError.message?.includes("trop de temps")) {
            const timeoutError = new Error("La connexion à la base de données a pris trop de temps. Vérifiez votre connexion internet et réessayez.");
            throw timeoutError;
          }
          
          throw dbError;
        }

        if (!data) {
          const noDataError = new Error("Aucun exercice trouvé dans la base de données. Avez-vous publié un exercice ?");
          log("No data returned ERROR", { exerciseId });
          throw noDataError;
        }

        // Vérifier une dernière fois avant de mettre à jour l'état
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }

        // Reconstruction de l'objet Exercise
        const content = data.content || {};
        
        // On s'assure que tout est défini pour éviter les crashs
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

        if (isMountedRef.current && !abortController.signal.aborted) {
          setExercise(fullExercise);
          setVariables(generateVariables(fullExercise.variables));
          onLoad?.(fullExercise);
        }

      } catch (err) {
        // Ignorer les erreurs si la requête a été annulée
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }

        const elapsed = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        log("loadExercise ERROR", { 
          error: errorMessage,
          elapsedMs: elapsed
        });
        
        if (isMountedRef.current && !abortController.signal.aborted) {
          setError(errorMessage);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isMountedRef.current && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadExercise();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Annuler la requête en cours
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [exerciseId]); // Retirer onLoad et onError des dépendances pour éviter les re-renders

  const handleRegenerate = useCallback(() => {
    if (exercise) {
      setVariables(generateVariables(exercise.variables));
    }
  }, [exercise]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Chargement de l'exercice...</p>
      </div>
    );
  }

  if (error) {
    const isTimeoutError = error.includes("trop de temps") || error.includes("timeout") || error.includes("connexion");
    
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-red-800 font-bold text-lg mb-2">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">{error}</p>
        {isTimeoutError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Conseil :</strong> Vérifiez votre connexion internet. Si le problème persiste, la base de données peut être temporairement indisponible.
            </p>
          </div>
        )}
        <button 
          onClick={() => {
            // Réinitialiser l'état et réessayer
            setError(null);
            setLoading(true);
            // Le useEffect se relancera automatiquement car exerciseId n'a pas changé
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
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
            <span className="bg-gray-100 px-2 py-0.5 rounded">{exercise.chapter}</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{exercise.difficulty}</span>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Nouvelles valeurs
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
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