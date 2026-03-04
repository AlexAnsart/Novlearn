"use client";

import { Trophy, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Layout } from "../../../components/Layout";
import MathText from "../../../components/ui/MathText";
import { useAuth } from "../../../contexts/AuthContext";
import { Duel, duelsApi } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import QuestionRenderer from "../../../renderers/QuestionRenderer";
import { Exercise, TextContent, VariableValues } from "../../../types/exercise";
import { evaluate } from "../../../utils/math/evaluation";

export default function ActiveDuelPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const duelId = parseInt(params.id as string);

  const [duel, setDuel] = useState<Duel | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [loading, setLoading] = useState(true);
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(180);
  const [forceFinished, setForceFinished] = useState(false);

  const loadDuel = useCallback(async () => {
    try {
      setLoading(true);
      const { duel: duelData } = await duelsApi.getDuel(duelId);
      setDuel(duelData);

      // Initialize or refresh global duel timer from started_at
      if (duelData.started_at) {
        const startedAt = new Date(duelData.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startedAt) / 1000);
        const total = 180;
        const remaining = Math.max(0, total - elapsed);
        setRemainingSeconds(remaining);
        setForceFinished(remaining <= 0 || duelData.status === "finished");
      }

      // Load exercise
      if (duelData.exercise) {
        const exerciseContent = duelData.exercise.content;
        const fullExercise: Exercise = {
          id: duelData.exercise.id,
          title: duelData.exercise.title,
          app_title: duelData.exercise.app_title || duelData.exercise.title,
          chapter: duelData.exercise.chapter,
          difficulty: duelData.exercise.difficulty,
          competences: [],
          variables: exerciseContent.variables || [],
          elements: exerciseContent.elements || [],
        };
        setExercise(fullExercise);

        // Use shared variables from duel
        if (duelData.exercise_data?.variables) {
          setVariables(duelData.exercise_data.variables);
        }

        // Reset per-exercise timer when a new exercise is loaded
        if (duelData.status === "active") {
          setExerciseStartTime(Date.now());
        }
      }
    } catch (error: any) {
      console.error("Error loading duel:", error);
      alert(error.message || "Erreur lors du chargement du duel");
      router.push("/duel");
    } finally {
      setLoading(false);
    }
  }, [duelId, router]);

  // Load duel data
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    loadDuel();
  }, [duelId, user, router, loadDuel]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!duel) return;

    const channel = supabase
      .channel(`duel:${duelId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `id=eq.${duelId}`,
        },
        (payload) => {
          console.log("Duel updated:", payload);
          setDuel(payload.new as Duel);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duelId, duel]);

  // Local countdown timer based on duel.started_at
  useEffect(() => {
    if (!duel || !duel.started_at || duel.status !== "active") return;

    const total = 180;

    const tick = () => {
      const startedAt = new Date(duel.started_at as string).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setForceFinished(true);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [duel]);

  const handleAnswerSubmit = useCallback(
    async (answer: string, isCorrect: boolean) => {
      if (!exercise || !duel) return;
      if (duel.status === "finished" || forceFinished) return;

      const now = Date.now();
      const timeSpent = exerciseStartTime ? now - exerciseStartTime : 0;

      try {
        const result = await duelsApi.submitAnswer(
          duelId,
          exercise.elements[0].id, // Pour l'instant, on utilise le premier élément
          answer,
          isCorrect,
          timeSpent,
        );

        if (result.duel) {
          setDuel(result.duel);
        }

        // Si la réponse est correcte, on recharge l'exercice pour avoir de nouvelles variables
        if (isCorrect) {
          await loadDuel();
        }
      } catch (error: any) {
        console.error("Error submitting answer:", error);
        alert(error.message || "Erreur lors de la soumission de la réponse");
      }
    },
    [exercise, duel, duelId, exerciseStartTime, forceFinished, loadDuel],
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p
              className="text-blue-200"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
            >
              Chargement du duel...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!duel || !exercise) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p
              className="text-red-200 text-xl"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Duel introuvable
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const isPlayer1 = duel.player1_id === user?.id;
  const myScore = isPlayer1 ? duel.player1_score : duel.player2_score;
  const opponentScore = isPlayer1 ? duel.player2_score : duel.player1_score;
  const opponentName = isPlayer1
    ? `${
        duel.player2?.profiles?.[0]?.first_name ||
        duel.player2?.email?.split("@")[0] ||
        "Adversaire"
      }`
    : `${
        duel.player1?.profiles?.[0]?.first_name ||
        duel.player1?.email?.split("@")[0] ||
        "Adversaire"
      }`;

  const totalDurationSeconds = 180;
  const safeRemaining = Math.max(0, remainingSeconds);
  const minutes = Math.floor(safeRemaining / 60);
  const seconds = safeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  const duelFinished =
    duel.status === "finished" || forceFinished || safeRemaining === 0;

  let finalTitle = "Duel terminé";
  let finalSubtitle = "";
  if (myScore > opponentScore) {
    finalTitle = "Victoire !";
    finalSubtitle = "Bravo, tu as remporté ce duel.";
  } else if (myScore < opponentScore) {
    finalTitle = "Défaite";
    finalSubtitle = "Ce n'est que partie remise, retente ta chance !";
  } else {
    finalTitle = "Égalité";
    finalSubtitle = "Vous êtes au coude-à-coude, qui gagnera la prochaine fois ?";
  }

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with scores */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              {/* Player 1 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p
                    className="text-white text-lg"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {isPlayer1 ? "Vous" : opponentName}
                  </p>
                  <p
                    className="text-blue-200 text-3xl"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {isPlayer1 ? myScore : opponentScore}
                  </p>
                </div>
              </div>

              {/* VS + Timer */}
              <div className="text-center">
                <p
                  className="text-white text-4xl"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  VS
                </p>
                <div className="flex flex-col items-center gap-1 mt-2 text-yellow-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <p
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {duelFinished ? "Duel terminé" : "En direct"}
                    </p>
                  </div>
                  <p
                    className="text-sm text-yellow-200"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Temps restant : {formattedTime}
                  </p>
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p
                    className="text-white text-lg"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {isPlayer1 ? opponentName : "Vous"}
                  </p>
                  <p
                    className="text-purple-200 text-3xl"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {isPlayer1 ? opponentScore : myScore}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {duelFinished ? (
            <div className="bg-slate-900/70 backdrop-blur-sm rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="text-center space-y-3">
                <h2
                  className="text-3xl text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  {finalTitle}
                </h2>
                <p
                  className="text-slate-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  {finalSubtitle}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-10">
                <div className="text-center">
                  <p className="text-sm text-slate-300 mb-1">Vous</p>
                  <p
                    className="text-3xl text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    {isPlayer1 ? myScore : opponentScore}
                  </p>
                </div>
                <div className="text-slate-400 text-lg">-</div>
                <div className="text-center">
                  <p className="text-sm text-slate-300 mb-1">{opponentName}</p>
                  <p
                    className="text-3xl text-purple-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    {isPlayer1 ? opponentScore : myScore}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => router.push("/duel")}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  Retour aux duels
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Exercise */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="mb-6">
                  <h2
                    className="text-white text-2xl mb-2"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    {exercise.title}
                  </h2>
                  <div className="flex gap-2">
                    <span
                      className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      {exercise.chapter}
                    </span>
                    <span
                      className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>

                {/* Render exercise elements */}
                <div className="space-y-6">
                  {exercise.elements.map((element) => {
                    if (element.type === "text") {
                      const textContent = element.content as TextContent;
                      return (
                        <div key={element.id} className="text-white text-lg">
                          <MathText
                            content={textContent.text}
                            variables={variables}
                            autoLatex={true}
                          />
                        </div>
                      );
                    } else if (element.type === "question") {
                      // Calculate correct answer with variables
                      const questionContent = element.content as any;
                      let correctAnswer: number | undefined;

                      if (
                        questionContent.answerType === "numeric" &&
                        questionContent.answer
                      ) {
                        try {
                          // Évaluation sécurisée avec mathjs (évite l'injection de code)
                          // Convert VariableValues to Record<string, number> for evaluate
                          const numericVars: Record<string, number> = {};
                          Object.keys(variables).forEach((varName) => {
                            const val = variables[varName];
                            numericVars[varName] =
                              typeof val === "number"
                                ? val
                                : parseFloat(String(val));
                          });
                          correctAnswer = evaluate(
                            questionContent.answer,
                            numericVars,
                          );
                        } catch (e) {
                          console.error("Error evaluating answer:", e);
                        }
                      }

                      return (
                        <QuestionRenderer
                          key={element.id}
                          content={{
                            ...questionContent,
                            correctAnswer: String(correctAnswer), // On s'assure que c'est une string
                            answerFormat: "number", // On force le format numérique pour les duels
                          }}
                          variables={variables}
                          // On supprime la prop 'correctAnswer=' qui n'existe plus
                          onSubmit={handleAnswerSubmit}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="text-center">
                <p
                  className="text-blue-200 text-sm"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Pendant 3 minutes, enchaîne les exercices. Premier à répondre correctement = +1 point.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
