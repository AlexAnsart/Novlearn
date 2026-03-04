import {
  ArrowRight,
  CheckCircle2,
  Flag,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { computeNewScore, difficultyToLevel } from "../../lib/competenceScore";
import { supabase } from "../../lib/supabase";
import {
  getCompetenceById,
  normalizeCompetenceId,
} from "../../settings/competenceSettings";
import { Exercise, VariableValues } from "../../types/exercise";
import { generateVariables } from "../../utils/variableGenerator";
import { FeedbackModal } from "../ui/FeedbackModal";
import { HelpModal } from "../ui/HelpModal";
import ExerciseRenderer from "./ExerciseRenderer";

async function updateCompetenceScore(
  userId: string,
  competenceId: string,
  difficulty: string,
  isCorrect: boolean,
): Promise<void> {
  try {
    const competenceConfig = getCompetenceById(competenceId);
    const maxPoints = competenceConfig?.max_points ?? 10;

    const { data: scoreRow, error: selectError } = await supabase
      .from("user_competence_scores")
      .select("points, streak")
      .eq("user_id", userId)
      .eq("competence_id", competenceId)
      .maybeSingle();

    if (selectError) throw selectError;

    const currentPoints = scoreRow?.points ?? 0;
    const currentStreak = scoreRow?.streak ?? 0;

    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const newPoints = isCorrect
      ? computeNewScore(
          currentPoints,
          maxPoints,
          difficultyToLevel(difficulty),
          currentStreak,
        )
      : currentPoints;

    const { error: upsertError } = await supabase
      .from("user_competence_scores")
      .upsert(
        {
          user_id: userId,
          competence_id: competenceId,
          points: newPoints,
          streak: newStreak,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,competence_id" },
      );

    if (upsertError) throw upsertError;
  } catch (e) {
    console.error("[updateCompetenceScore] ❌ ERROR:", e);
    throw e;
  }
}

interface ExerciseLoaderProps {
  exerciseId?: string;
  competenceId?: string | null;
  competences?: string[];
  onLoad?: (exercise: Exercise) => void;
  onElementSubmit?: (
    elementId: number,
    answer: unknown,
    isCorrect: boolean,
  ) => void;
  onError?: (error: Error) => void;
  shouldCountPoints?: boolean;
  mode?: "test" | "recommendation";
  onNextClick?: (hasErrors: boolean) => Promise<void>;
}

export const ExerciseLoader: React.FC<ExerciseLoaderProps> = ({
  exerciseId,
  competenceId: competenceIdFromProps,
  competences: competencesFromProps,
  onLoad,
  onElementSubmit,
  onError,
  shouldCountPoints = false,
  mode,
  onNextClick,
}) => {
  const router = useRouter();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [loading, setLoading] = useState(true);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [completedElements, setCompletedElements] = useState<Set<number>>(
    new Set(),
  );
  const [isExerciseFinished, setIsExerciseFinished] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [pendingNextAction, setPendingNextAction] = useState<
    (() => void | Promise<void>) | null
  >(null);
  const [isFeedbackDifficultyOnly, setIsFeedbackDifficultyOnly] =
    useState(false);

  const [lastSaveStatus, setLastSaveStatus] = useState<
    "idle" | "saved" | "no_session" | "error"
  >("idle");
  const [isNextLoading, setIsNextLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackPendingRef = useRef(false);
  const exerciseSavedRef = useRef(false); // Empêche les doubles sauvegardes

  const totalQuestions = useMemo(() => {
    if (!exercise) return 0;
    return exercise.elements.filter(
      (el) =>
        ["question", "mcq", "equation"].includes(el.type) &&
        (el.type !== "equation" || (el.content as any).requireAnswer),
    ).length;
  }, [exercise]);

  useEffect(() => {
    if (isFeedbackOpen || feedbackPendingRef.current) return;

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
      exerciseSavedRef.current = false; // Réinitialiser pour le nouvel exercice

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
        const effectiveCompetences =
          competencesFromProps &&
          Array.isArray(competencesFromProps) &&
          competencesFromProps.length > 0
            ? competencesFromProps
            : competenceIdFromProps
              ? [competenceIdFromProps]
              : (data.competences ?? []);

        const fullExercise = {
          ...content,
          id: data.id,
          title: data.title,
          app_title: data.app_title,
          chapter: data.chapter,
          difficulty: data.difficulty,
          competence_id: effectiveCompetences[0] ?? null,
          competences: effectiveCompetences,
          variables: content.variables || [],
          elements: content.elements || [],
        } as unknown as Exercise;

        setExercise(fullExercise);
        setVariables(generateVariables(fullExercise.variables));
        if (onLoad) onLoad(fullExercise);
      } catch (err) {
        if (abortController.signal.aborted) return;
        const msg = err instanceof Error ? err.message : "Erreur de chargement";
        setError(msg);
        if (onError) onError(err instanceof Error ? err : new Error(msg));
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsTakingLong(false);
        }
      }
    };

    loadExercise();
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, competenceIdFromProps, refreshTrigger]);

  const handleElementSubmit = useCallback(
    (elementId: number, answer: unknown, isCorrect: boolean) => {
      // Callback externe pour le parent (si besoin)
      if (onElementSubmit) onElementSubmit(elementId, answer, isCorrect);

      // Marquer si erreur
      if (!isCorrect) setHasErrors(true);

      // Ajouter l'élément à la liste des complétés et vérifier si exercice terminé
      setCompletedElements((prev) => {
        const next = new Set(prev).add(elementId);
        if (exercise && next.size >= totalQuestions && totalQuestions > 0) {
          setIsExerciseFinished(true);
        }
        return next;
      });
    },
    [exercise, totalQuestions, onElementSubmit],
  );

  // Sauvegarde finale de l'exercice en BDD (une seule ligne par exercice)
  useEffect(() => {
    if (!isExerciseFinished || exerciseSavedRef.current || !exercise) return;

    const saveExerciseAttempt = async () => {
      exerciseSavedRef.current = true;
      setLastSaveStatus("idle");

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setLastSaveStatus("no_session");
        return;
      }

      const exerciseIdNum = Number(exercise.id);
      if (Number.isNaN(exerciseIdNum)) return;

      // L'exercice est correct uniquement si TOUTES les questions sont justes
      const isExerciseCorrect = !hasErrors;

      const { error } = await supabase.from("exercise_attempts").insert({
        user_id: currentUser.id,
        exercise_id: exerciseIdNum,
        is_correct: isExerciseCorrect,
        time_spent: null,
      });
      setLastSaveStatus(error ? "error" : "saved");

      // Mise à jour des scores de compétences (une seule fois, à la fin)
      const effectiveCompetences = competencesFromProps?.length
        ? competencesFromProps
        : (exercise.competences ?? []);

      if (effectiveCompetences.length > 0 && shouldCountPoints) {
        const normalizedIds = effectiveCompetences
          .map((c) => normalizeCompetenceId(c))
          .filter((id): id is string => id !== null);
        await Promise.all(
          normalizedIds.map((id) =>
            updateCompetenceScore(
              currentUser.id,
              id,
              exercise.difficulty,
              isExerciseCorrect,
            ),
          ),
        );
      }
    };

    saveExerciseAttempt();
  }, [
    isExerciseFinished,
    exercise,
    hasErrors,
    shouldCountPoints,
    competencesFromProps,
  ]);

  const proceedToNext = useCallback(() => {
    feedbackPendingRef.current = false; // Libération du verrou
    if (exerciseId) {
      router.push("/exercices");
    } else {
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [exerciseId, router]);

  const handleNextExercise = async () => {
    const shouldAskFeedback = Math.random() < 0.15;

    // Définir l'action de base à effectuer (onNextClick ou rechargement local)
    const nextAction = async () => {
      if (onNextClick) {
        setIsNextLoading(true);
        try {
          await onNextClick(hasErrors);
        } catch (e) {
          console.error(e);
        } finally {
          setIsNextLoading(false);
          feedbackPendingRef.current = false;
        }
      } else {
        proceedToNext();
      }
    };

    if (shouldAskFeedback) {
      feedbackPendingRef.current = true; // Activer le verrouillage
      setPendingNextAction(() => nextAction); // Stocker l'action
      setIsFeedbackDifficultyOnly(true);
      setIsFeedbackOpen(true); // Ouvrir la modale
    } else {
      await nextAction();
    }
  };

  const handleModalClose = () => {
    setIsFeedbackOpen(false);

    // On n'exécute l'action de suite pour éviter un conflit de rendu
    if (pendingNextAction) {
      // Un petit délai assure que l'état de la modale est bien traité par React
      setTimeout(() => {
        pendingNextAction();
        setPendingNextAction(null);
      }, 100);
    } else {
      feedbackPendingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Chargement de l'exercice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center bg-red-50 border border-red-100 rounded-xl min-h-[300px]">
        <h3 className="text-red-800 font-bold mb-2">Oups !</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => setRefreshTrigger((p) => p + 1)}
          className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={handleModalClose}
        exerciseId={exercise.id}
        exerciseTitle={exercise.app_title || exercise.title}
        onlyDifficulty={isFeedbackDifficultyOnly}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800">
              {exercise.app_title || exercise.title}
            </h2>
            {mode && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${mode === "test" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}
              >
                {mode === "test" ? "Mode test" : "Recommandation"}
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
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${exercise.difficulty === "Difficile" ? "bg-red-50 text-red-700" : exercise.difficulty === "Moyen" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}
            >
              {exercise.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Passer visible tant que l'exercice n'est pas fini */}
          {!isExerciseFinished && (
            <button
              onClick={async () => {
                // Passe à l'exercice suivant sans compter faux
                if (onNextClick) {
                  setIsNextLoading(true);
                  try {
                    await onNextClick(hasErrors); // conserve l'état actuel
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsNextLoading(false);
                    feedbackPendingRef.current = false;
                  }
                } else {
                  proceedToNext();
                }
              }}
              disabled={isNextLoading || isFeedbackOpen}
              className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-xl font-bold shadow hover:shadow-lg transition-all disabled:opacity-70 text-sm"
              style={{ minHeight: 0 }}
            >
              Passer
            </button>
          )}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Aide - Comment répondre ?"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setIsFeedbackDifficultyOnly(false);
              setIsFeedbackOpen(true);
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Signaler un problème"
          >
            <Flag className="w-5 h-5" />
          </button>
          {isExerciseFinished && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border animate-in zoom-in ${hasErrors ? "text-orange-600 bg-orange-50 border-orange-100" : "text-green-600 bg-green-50 border-green-100"}`}
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

      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 relative">
        <ExerciseRenderer
          exercise={exercise}
          preGeneratedVariables={variables}
          onElementSubmit={handleElementSubmit}
        />

        {isExerciseFinished && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500 border-t pt-6 border-slate-100">
            <button
              onClick={() => {
                setIsFeedbackDifficultyOnly(false);
                setIsFeedbackOpen(true);
              }}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Donner mon avis sur cet
              exercice
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleNextExercise}
                disabled={isNextLoading || isFeedbackOpen}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
              >
                {isNextLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Chargement…
                  </>
                ) : (
                  <>
                    Exercice Suivant{" "}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLoader;
