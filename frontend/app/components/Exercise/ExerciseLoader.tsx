import { ArrowRight, CheckCircle2, Flag, MessageSquare } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  computeNewScore,
  difficultyToLevel,
  getBonusStreak,
} from "../../lib/competenceScore";
import { supabase } from "../../lib/supabase";
import { getCompetenceById } from "../../settings/competenceSettings";
import { Exercise, VariableValues } from "../../types/exercise";
import { generateVariables } from "../../utils/variableGenerator";
import { FeedbackModal } from "../ui/FeedbackModal";
import ExerciseRenderer from "./ExerciseRenderer";

async function updateCompetenceScore(
  userId: string,
  competenceId: string,
  difficulty: string,
  isCorrect: boolean,
): Promise<void> {
  try {
    console.log(`[updateCompetenceScore] START: userId=${userId.slice(0, 8)}..., competenceId=${competenceId}, difficulty=${difficulty}, isCorrect=${isCorrect}`);
    
    const competenceConfig = getCompetenceById(competenceId);
    const maxPoints = competenceConfig?.max_points ?? 10;
    console.log(`[updateCompetenceScore] Competence config:`, { name: competenceConfig?.name, maxPoints });

    const { data: scoreRow, error: selectError } = await supabase
      .from("user_competence_scores")
      .select("points, streak")
      .eq("user_id", userId)
      .eq("competence_id", competenceId)
      .maybeSingle();
    
    if (selectError) {
      console.error(`[updateCompetenceScore] Error selecting score:`, selectError);
      throw selectError;
    }
    
    const currentPoints = scoreRow?.points ?? 0;
    const currentStreak = scoreRow?.streak ?? 0;
    console.log(`[updateCompetenceScore] Current state: points=${currentPoints}, streak=${currentStreak}`);

    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const newPoints = isCorrect
      ? computeNewScore(
          currentPoints,
          maxPoints,
          difficultyToLevel(difficulty),
          currentStreak,
        )
      : currentPoints;

    // Log points gained for debugging
    if (isCorrect) {
      const pointsGained = newPoints - currentPoints;
      const difficultyLevel = difficultyToLevel(difficulty);
      const bonusStreak = getBonusStreak(currentStreak);
      console.log(`[Points] ✅ Competence: ${competenceConfig?.name || competenceId}, Points gagnés: ${pointsGained} (difficulté: ${difficultyLevel + 1}, bonus streak: ${bonusStreak}), Total: ${currentPoints} → ${newPoints}/${maxPoints}`);
    } else {
      console.log(`[Points] ❌ Answer incorrect, no points gained. Streak reset to 0.`);
    }

    const { error: upsertError } = await supabase.from("user_competence_scores").upsert(
      {
        user_id: userId,
        competence_id: competenceId,
        points: newPoints,
        streak: newStreak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,competence_id" },
    );
    
    if (upsertError) {
      console.error(`[updateCompetenceScore] ❌ Error upserting score:`, upsertError);
      throw upsertError;
    }
    
    console.log(`[updateCompetenceScore] ✅ Successfully updated: points=${newPoints}, streak=${newStreak}`);
  } catch (e) {
    console.error("[updateCompetenceScore] ❌ ERROR:", e);
    throw e; // Re-throw to allow caller to handle
  }
}

interface ExerciseLoaderProps {
  exerciseId?: string;
  competenceId?: string | null; // Keep for backward compatibility
  competences?: string[]; // Array of competences from recommendation API (preferred, overrides DB value)
  onLoad?: (exercise: Exercise) => void;
  onElementSubmit?: (
    elementId: number,
    answer: unknown,
    isCorrect: boolean,
  ) => void;
  onError?: (error: Error) => void;
  shouldCountPoints?: boolean; // If true, points will be counted (only for recommended exercises from home page)
  mode?: "test" | "recommendation"; // Display badge: placement test vs normal recommendation
  onNextClick?: (hasErrors: boolean) => Promise<void>; // When provided, called on "Next" instead of navigating
}

export const ExerciseLoader: React.FC<ExerciseLoaderProps> = ({
  exerciseId,
  competenceId: competenceIdFromProps, // Keep for backward compatibility
  competences: competencesFromProps, // Array of competences (preferred)
  onLoad,
  onElementSubmit,
  onError,
  shouldCountPoints = false,
  mode,
  onNextClick,
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
  const [completedElements, setCompletedElements] = useState<Set<number>>(
    new Set(),
  );
  const [isExerciseFinished, setIsExerciseFinished] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  // État de la modale de feedback
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [pendingNextAction, setPendingNextAction] = useState<
    (() => void | Promise<void>) | null
  >(null);
  const [isFeedbackDifficultyOnly, setIsFeedbackDifficultyOnly] =
    useState(false);

  // Feedback d'enregistrement de la tentative (pour debug / UX)
  const [lastSaveStatus, setLastSaveStatus] = useState<
    "idle" | "saved" | "no_session" | "error"
  >("idle");
  const [isNextLoading, setIsNextLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalQuestions = useMemo(() => {
    if (!exercise) return 0;
    return exercise.elements.filter(
      (el) =>
        ["question", "mcq", "equation"].includes(el.type) &&
        (el.type !== "equation" || (el.content as any).requireAnswer),
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
        // Use competences array from props (recommendation API) if provided, otherwise use DB value
        // Prefer competences array over single competence_id
        const effectiveCompetences = competencesFromProps && Array.isArray(competencesFromProps) && competencesFromProps.length > 0
          ? competencesFromProps
          : (competenceIdFromProps !== undefined && competenceIdFromProps !== null
              ? [competenceIdFromProps]
              : (data.competences && Array.isArray(data.competences) && data.competences.length > 0
                  ? data.competences
                  : (data.competence_id ? [data.competence_id] : [])));
        
        const fullExercise = {
          ...content,
          id: data.id,
          title: data.title,
          chapter: data.chapter,
          difficulty: data.difficulty,
          competence_id: effectiveCompetences[0] ?? null, // Keep for backward compatibility
          competences: effectiveCompetences, // Array of competences
          variables: content.variables || [],
          elements: content.elements || [],
        } as unknown as Exercise;
        
        console.log(`[ExerciseLoader] 📥 Exercise loaded: id=${fullExercise.id}, competences=${JSON.stringify(effectiveCompetences)}, difficulty=${fullExercise.difficulty}, shouldCountPoints=${shouldCountPoints}`);

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
  }, [exerciseId, competenceIdFromProps, refreshTrigger]);

  // =========================================================
  // GESTIONNAIRES D'INTERACTION
  // =========================================================

  const handleElementSubmit = useCallback(
    async (elementId: number, answer: unknown, isCorrect: boolean) => {
      console.log(`[ExerciseLoader] 🔵 handleElementSubmit CALLED: elementId=${elementId}, isCorrect=${isCorrect}, exercise=${exercise?.id}, competences prop=${JSON.stringify(competencesFromProps)}, exercise.competences=${JSON.stringify(exercise?.competences)}, shouldCountPoints=${shouldCountPoints}`);
      if (onElementSubmit) onElementSubmit(elementId, answer, isCorrect);
      setLastSaveStatus("idle");

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("[ExerciseLoader] getUser failed:", userError.message);
        setLastSaveStatus("error");
      }
      if (!currentUser || !exercise) {
        if (!currentUser) {
          console.warn(
            "[ExerciseLoader] No user: connect to save attempts in Ma progression.",
          );
          setLastSaveStatus("no_session");
        }
        setCompletedElements((prev) => {
          const next = new Set(prev).add(elementId);
          if (exercise && next.size >= totalQuestions && totalQuestions > 0)
            setIsExerciseFinished(true);
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
          console.error(
            "[ExerciseLoader] exercise_attempts insert failed:",
            error.message,
            error.code,
          );
          setLastSaveStatus("error");
        } else {
          setLastSaveStatus("saved");
        }
        // Use competences array from props (recommendation API) or fallback to exercise.competences
        // Prefer competences array over single competence_id
        const effectiveCompetences = competencesFromProps && Array.isArray(competencesFromProps) && competencesFromProps.length > 0
          ? competencesFromProps
          : (exercise.competences && Array.isArray(exercise.competences) && exercise.competences.length > 0
              ? exercise.competences
              : (competenceIdFromProps !== undefined && competenceIdFromProps !== null
                  ? [competenceIdFromProps]
                  : (exercise.competence_id ? [exercise.competence_id] : [])));
        
        // Debug: log all relevant values
        console.log(`[ExerciseLoader] handleElementSubmit DEBUG:`, {
          exerciseId: exercise.id,
          competencesFromProp: competencesFromProps,
          competenceIdFromProp: competenceIdFromProps,
          competencesFromExercise: exercise.competences,
          competenceIdFromExercise: exercise.competence_id,
          effectiveCompetences,
          shouldCountPoints,
          isCorrect,
          hasCompetences: effectiveCompetences.length > 0,
        });
        
        // Count points for each competence in the array
        if (effectiveCompetences.length > 0 && shouldCountPoints) {
          console.log(`[ExerciseLoader] ✅ Counting points for exercise ${exercise.id}, competences: ${JSON.stringify(effectiveCompetences)}, correct: ${isCorrect}`);
          // Update score for each competence
          const updatePromises = effectiveCompetences.map((competenceId) => {
            return updateCompetenceScore(
              currentUser.id,
              competenceId,
              exercise.difficulty,
              isCorrect,
            ).catch((err) => {
              console.error(`[ExerciseLoader] ❌ Error updating competence score for ${competenceId}:`, err);
            });
          });
          await Promise.all(updatePromises);
        } else {
          if (effectiveCompetences.length === 0) {
            console.log(`[ExerciseLoader] ⚠️ Points NOT counted - exercise ${exercise.id} has no competences (prop=${JSON.stringify(competencesFromProps)}, exercise=${JSON.stringify(exercise.competences)})`);
          } else if (!shouldCountPoints) {
            console.log(`[ExerciseLoader] ⚠️ Points NOT counted - exercise ${exercise.id}, shouldCountPoints=${shouldCountPoints}, competences: ${JSON.stringify(effectiveCompetences)}`);
          }
        }
      }

      if (!isCorrect) setHasErrors(true);
      setCompletedElements((prev) => {
        const next = new Set(prev).add(elementId);
        if (exercise && next.size >= totalQuestions && totalQuestions > 0)
          setIsExerciseFinished(true);
        return next;
      });
    },
    [exercise, totalQuestions, onElementSubmit, shouldCountPoints, competencesFromProps, competenceIdFromProps],
  );

  const proceedToNext = useCallback(() => {
    if (exerciseId) {
      router.push("/exercices");
    } else {
      setRefreshTrigger((prev) => prev + 1);
    }
    setPendingNextAction(null); // Nettoyage
  }, [exerciseId, router]);

  const handleNextExercise = async () => {
    // Probabilité de 15%
    const shouldAskFeedback = Math.random() < 0.15;

    if (shouldAskFeedback) {
      // On sauvegarde l'action "aller au suivant" pour plus tard
      setPendingNextAction(async () => {
        if (onNextClick) {
          setIsNextLoading(true);
          try {
            await onNextClick(hasErrors);
            console.log(`[ExerciseLoader] Next requested (hasErrors=${hasErrors}, mode=${mode})`);
          } catch (e) {
            console.error('[ExerciseLoader] onNextClick error:', e);
          } finally {
            setIsNextLoading(false);
          }
        } else {
          proceedToNext();
        }
      });
      // On active le mode restreint "Difficulté seule"
      setIsFeedbackDifficultyOnly(true);
      // On ouvre la modale
      setIsFeedbackOpen(true);
      return;
    }

    // Si pas de feedback demandé, procéder normalement
    if (onNextClick) {
      setIsNextLoading(true);
      try {
        await onNextClick(hasErrors);
        console.log(
          `[ExerciseLoader] Next requested (hasErrors=${hasErrors}, mode=${mode})`,
        );
      } catch (e) {
        console.error("[ExerciseLoader] onNextClick error:", e);
      } finally {
        setIsNextLoading(false);
      }
      return;
    }
    proceedToNext();
  };

  const handleModalClose = () => {
    setIsFeedbackOpen(false);

    if (pendingNextAction) {
      pendingNextAction();
    }
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
          onClick={() => setRefreshTrigger((p) => p + 1)}
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
      {/* 1. COMPOSANT MODALE : On passe la prop onlyDifficulty */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={handleModalClose}
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
        onlyDifficulty={isFeedbackDifficultyOnly}
      />

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800">
              {exercise.title}
            </h2>
            {mode === "test" && (
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-amber-200">
                Mode test
              </span>
            )}
            {mode === "recommendation" && (
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-indigo-100">
                Recommandation
              </span>
            )}
          </div>
          <div className="flex gap-2 text-sm text-gray-500">
            {exercise.chapter && (
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase tracking-wide font-semibold">
                {exercise.chapter}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                exercise.difficulty === "Difficile"
                  ? "bg-red-50 text-red-700"
                  : exercise.difficulty === "Moyen"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {exercise.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Signalement manuel : DOIT OUVRIR LA MODALE COMPLÈTE */}
          <button
            onClick={() => {
              setIsFeedbackDifficultyOnly(false);
              setIsFeedbackOpen(true);
            }}
            title="Signaler une erreur"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Flag className="w-5 h-5" />
          </button>

          {/* Badge de statut */}
          {isExerciseFinished && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border animate-in zoom-in
              ${
                hasErrors
                  ? "text-orange-600 bg-orange-50 border-orange-100" // Terminé avec fautes
                  : "text-green-600 bg-green-50 border-green-100" // Perfect
              }`}
            >
              {hasErrors ? (
                <Flag className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <span className="font-bold text-sm">
                {hasErrors ? "Exercice terminé" : "Exercice validé !"}
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
            {/* Bouton manuel "Donner avis" : DOIT OUVRIR LA MODALE COMPLÈTE */}
            <button
              onClick={() => {
                setIsFeedbackDifficultyOnly(false);
                setIsFeedbackOpen(true);
              }}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Donner mon avis sur cet exercice
            </button>

            {/* Bouton SUIVANT avec logique aléatoire */}
            <button
              onClick={handleNextExercise}
              disabled={isNextLoading}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isNextLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Chargement…
                </>
              ) : (
                <>
                  Exercice Suivant
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLoader;
