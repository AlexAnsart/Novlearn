import React, { useCallback, useEffect, useState } from "react";
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

  // Charge l'exercice depuis Supabase
  useEffect(() => {
    const loadExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from("exercises").select("*");

        if (exerciseId) {
          query = query.eq("id", exerciseId);
        } else {
          // Si pas d'ID, on prend le premier dispo
          query = query.limit(1);
        }

        // Utilisation de maybeSingle pour ne pas crasher si 0 résultat
        const { data, error: dbError } = await query.maybeSingle();

        if (dbError) {
          console.error("ERREUR SUPABASE:", dbError); // Regarde ta console F12 !
          throw dbError;
        }

        if (!data) {
          throw new Error("Aucun exercice trouvé dans la base de données. Avez-vous publié un exercice ?");
        }

        console.log("Données reçues de Supabase:", data); // Debug

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

        setExercise(fullExercise);
        setVariables(generateVariables(fullExercise.variables));
        onLoad?.(fullExercise);

      } catch (err) {
        console.error("Erreur complète:", err);
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setError(msg);
        onError?.(err instanceof Error ? err : new Error(msg));
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [exerciseId]); // Dépendance uniquement sur l'ID

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
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-red-800 font-bold text-lg mb-2">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
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