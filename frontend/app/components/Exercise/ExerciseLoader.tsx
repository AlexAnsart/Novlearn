import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Exercise, VariableValues } from "../../types/exercise";
import { generateVariables } from "../../utils/variableGenerator";
import ExerciseRenderer from "./ExerciseRenderer";
import { supabase } from "../../lib/supabase";
import { computeNewScore, difficultyToLevel } from "../../lib/competenceScore";
import { getCompetenceById } from "../../settings/competenceSettings";
import { ArrowRight, CheckCircle2, Flag, MessageSquare } from "lucide-react";
import { FeedbackModal } from "../ui/FeedbackModal";

async function updateCompetenceScore(
  userId: string,
  competenceId: string,
  difficulty: string,
  isCorrect: boolean
): Promise<void> {
  try {
    const competenceConfig = getCompetenceById(competenceId);
    const maxPoints = competenceConfig?.max_points ?? 10;

    const { data: scoreRow } = await supabase
      .from("user_competence_scores")
      .select("points, streak")
      .eq("user_id", userId)
      .eq("competence_id", competenceId)
      .maybeSingle();
    const currentPoints = scoreRow?.points ?? 0;
    const currentStreak = scoreRow?.streak ?? 0;

    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const newPoints = isCorrect
      ? computeNewScore(currentPoints, maxPoints, difficultyToLevel(difficulty), currentStreak)
      : currentPoints;

    await supabase.from("user_competence_scores").upsert(
      {
        user_id: userId,
        competence_id: competenceId,
        points: newPoints,
        streak: newStreak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,competence_id" }
    );
  } catch (e) {
    console.error("[ExerciseLoader] updateCompetenceScore:", e);
  }
}

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
  const router = useRouter();
  const pathname = usePathname();

  // États de données
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  
  // États de cycle de vie
  const [loading, setLoading] = useState(true);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  
  // États de progression
  const [completedElements, setCompletedElements] = useState<Set<number>>(new Set());
  const [isExerciseFinished, setIsExerciseFinished] = useState(false);
  const [hasErrors, setHasErrors] = useState(false); 

  // État de la modale de feedback
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  // Feedback d'enregistrement de la tentative (pour debug / UX)
  const [lastSaveStatus, setLastSaveStatus] = useState<"idle" | "saved" | "no_session" | "error">("idle");

  const abortControllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalQuestions = useMemo(() => {
    if (!exercise) return 0;
    return exercise.elements.filter(el => 
      ['question', 'mcq', 'equation'].includes(el.type) && 
      (el.type !== 'equation' || (el.content as any).requireAnswer)
    ).length;
  }, [exercise]);

  // =========================================================
  // LOGIQUE DE CHARGEMENT
  // =========================================================
  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadExercise = async () => {
      setLoading(true);
      setError(null);
      setIsTakingLong(false);
      setIsExerciseFinished(false);
      setCompletedElements(new Set());
      setHasErrors(false);
      setLastSaveStatus("idle"); 

      slowTimerRef.current = setTimeout(() => {
        if (!abortController.signal.aborted) setIsTakingLong(true);
      }, 3000);

      try {
        let data = null;
        let dbError = null;

        if (exerciseId) {
          const result = await supabase
            .from("exercises")
            .select("*")
            .eq("id", exerciseId)
            .maybeSingle();
          data = result.data;
          dbError = result.error;
        } else {
          const { count, error: countError } = await supabase
            .from("exercises")
            .select("*", { count: "exact", head: true });

          if (countError) throw countError;
          const total = count || 0;
          
          if (total > 0) {
            const randomOffset = Math.floor(Math.random() * total);
            const result = await supabase
              .from("exercises")
              .select("*")
              .range(randomOffset, randomOffset)
              .maybeSingle();
            data = result.data;
            dbError = result.error;
          } else {
            throw new Error("La base d'exercices est vide.");
          }
        }

        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        if (abortController.signal.aborted) return;
        if (dbError) throw dbError;
        if (!data) throw new Error("Exercice introuvable.");

        const content = data.content || {};
        const fullExercise = {
          ...content,
          id: data.id,
          title: data.title,
          chapter: data.chapter,
          difficulty: data.difficulty,
          competence_id: data.competence_id ?? null,
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
        const msg = err instanceof Error ? err.message : "Erreur de chargement";
        setError(msg);
        if (onError) onError(err instanceof Error ? err : new Error(msg));
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsTakingLong(false);
          if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        }
      }
    };

    loadExercise();

    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      abortController.abort();
    };
  }, [exerciseId, refreshTrigger]);

  // =========================================================
  // GESTIONNAIRES D'INTERACTION
  // =========================================================

  const handleElementSubmit = useCallback(async (elementId: number, answer: unknown, isCorrect: boolean) => {
    if (onElementSubmit) onElementSubmit(elementId, answer, isCorrect);
    setLastSaveStatus("idle");

    // Validated user (server check) so insert is accepted by RLS
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("[ExerciseLoader] getUser failed:", userError.message);
      setLastSaveStatus("error");
    }
    if (!currentUser || !exercise) {
      if (!currentUser) {
        console.warn("[ExerciseLoader] No user: connect to save attempts in Ma progression.");
        setLastSaveStatus("no_session");
      }
      setCompletedElements(prev => {
        const next = new Set(prev).add(elementId);
        if (exercise && next.size >= totalQuestions && totalQuestions > 0) setIsExerciseFinished(true);
        return next;
      });
      if (!isCorrect) setHasErrors(true);
      return;
    }

    const exerciseIdNum = Number(exercise.id);
    if (Number.isNaN(exerciseIdNum)) {
      console.error("[ExerciseLoader] Invalid exercise.id:", exercise.id);
      setLastSaveStatus("error");
    } else {
      const { error } = await supabase.from("exercise_attempts").insert({
        user_id: currentUser.id,
        exercise_id: exerciseIdNum,
        is_correct: isCorrect,
        time_spent: null,
      });
      if (error) {
        console.error("[ExerciseLoader] exercise_attempts insert failed:", error.message, error.code);
        setLastSaveStatus("error");
      } else {
        setLastSaveStatus("saved");
      }
      if (exercise.competence_id) {
        updateCompetenceScore(currentUser.id, exercise.competence_id, exercise.difficulty, isCorrect);
      }
    }

    if (!isCorrect) setHasErrors(true);
    setCompletedElements(prev => {
      const next = new Set(prev).add(elementId);
      if (exercise && next.size >= totalQuestions && totalQuestions > 0) setIsExerciseFinished(true);
      return next;
    });
  }, [exercise, totalQuestions, onElementSubmit]);

  const handleNextExercise = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Chargement de l'exercice...</p>
        {isTakingLong && (
          <p className="text-sm text-gray-400 mt-2 animate-pulse text-center max-w-md">
            Patience, nous préparons vos variables...
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
        <h3 className="text-red-800 font-bold mb-2">Oups !</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => setRefreshTrigger(p => p + 1)}
          className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* 1. COMPOSANT MODALE (AJOUTÉ) */}
      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
      />

      {/* En-tête */}
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
        
        <div className="flex items-center gap-2">
          {/* 2. BOUTON SIGNALEMENT ERREUR (AJOUTÉ) */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            title="Signaler une erreur"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Flag className="w-5 h-5" />
          </button>

          {/* Badge de statut */}
          {isExerciseFinished && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border animate-in zoom-in
              ${hasErrors 
                ? 'text-orange-600 bg-orange-50 border-orange-100' // Terminé avec fautes
                : 'text-green-600 bg-green-50 border-green-100'   // Perfect
              }`}>
              {hasErrors ? <Flag className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span className="font-bold text-sm">
                {hasErrors ? 'Exercice terminé' : 'Exercice validé !'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 relative">
        <ExerciseRenderer
          exercise={exercise}
          preGeneratedVariables={variables}
          onElementSubmit={handleElementSubmit}
        />

        {/* Feedback enregistrement tentative */}
        {lastSaveStatus !== "idle" && (
          <p
            className={`mt-3 text-sm ${
              lastSaveStatus === "saved"
                ? "text-green-600"
                : lastSaveStatus === "no_session"
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {lastSaveStatus === "saved"
              ? "Tentative enregistrée dans Ma progression."
              : lastSaveStatus === "no_session"
              ? "Connecte-toi pour enregistrer tes tentatives dans Ma progression."
              : "Erreur d'enregistrement (voir la console)."}
          </p>
        )}

        {/* Zone de fin (Boutons Suivant et Feedback) */}
        {isExerciseFinished && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500 border-t pt-6 border-slate-100">
            
            {/* 3. BOUTON DONNER AVIS (AJOUTÉ) */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Donner mon avis sur cet exercice
            </button>

            <button
              onClick={handleNextExercise}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
            >
              Exercice Suivant
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLoader;