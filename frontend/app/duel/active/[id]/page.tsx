"use client";

import { Trophy, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "../../../components/Layout";
import MathText from "../../../components/ui/MathText";
import { useAuth } from "../../../contexts/AuthContext";
import { Duel, duelsApi } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import QuestionRenderer from "../../../renderers/QuestionRenderer";
import { Exercise, TextContent, VariableValues } from "../../../types/exercise";
import {
  DUEL_CORRECTION_DISPLAY_SECONDS,
  DUEL_DURATION_SECONDS,
  DUEL_EXERCISE_TIMEOUT_SECONDS,
} from "../../../settings/duelSettings";
import { evaluate } from "../../../utils/math/evaluation";
import { substituteVariables } from "../../../utils/math/parsing";

export type DuelConfig = {
  duelDurationSeconds: number;
  exerciseTimeoutSeconds: number;
  correctionDisplaySeconds: number;
};

function getCorrectionFromExercise(
  ex: Exercise,
  vars: VariableValues,
): { correctAnswer: string; explanation?: string; variables: VariableValues } | null {
  const question = ex.elements?.find((el) => el.type === "question");
  if (!question || question.type !== "question") return null;
  const q = question.content as { answer?: string; correctAnswer?: string; explanation?: string };
  const expr = q.answer ?? q.correctAnswer ?? "";
  if (!expr.trim()) return null;
  try {
    const numericVars: Record<string, number> = {};
    Object.keys(vars).forEach((k) => {
      const v = vars[k];
      numericVars[k] = typeof v === "number" ? v : parseFloat(String(v));
    });
    const computed = evaluate(expr, numericVars);
    const text =
      computed !== undefined && !Number.isNaN(computed)
        ? String(computed)
        : expr.trim();
    return { correctAnswer: text, explanation: q.explanation, variables: vars };
  } catch {
    return { correctAnswer: expr.trim(), explanation: q.explanation, variables: vars };
  }
}

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
  const [remainingSeconds, setRemainingSeconds] = useState<number>(DUEL_DURATION_SECONDS);
  const [exerciseRemainingSeconds, setExerciseRemainingSeconds] = useState<number>(
    DUEL_EXERCISE_TIMEOUT_SECONDS,
  );
  const [forceFinished, setForceFinished] = useState(false);
  const [missedCorrection, setMissedCorrection] = useState<{
    correctAnswer: string;
    explanation?: string;
    variables: VariableValues;
  } | null>(null);
  const [duelConfig, setDuelConfig] = useState<DuelConfig | null>(null);

  const currentExerciseIdRef = useRef<number | null>(null);
  const currentExerciseRef = useRef<Exercise | null>(null);
  const currentVariablesRef = useRef<VariableValues>({});
  const submittingCorrectRef = useRef(false);

  const durationSec = duelConfig?.duelDurationSeconds ?? DUEL_DURATION_SECONDS;
  const exerciseTimeoutSec = duelConfig?.exerciseTimeoutSeconds ?? DUEL_EXERCISE_TIMEOUT_SECONDS;
  const correctionDisplaySec = duelConfig?.correctionDisplaySeconds ?? DUEL_CORRECTION_DISPLAY_SECONDS;

  const loadDuel = useCallback(
    async (silent = false, skipCorrection = false) => {
      try {
        if (!silent) setLoading(true);
        const { duel: duelData } = await duelsApi.getDuel(duelId);
        setDuel(duelData);

        // Initialize or refresh global duel timer from started_at
        if (duelData.started_at) {
          const startedAt = new Date(duelData.started_at).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startedAt) / 1000);
          const remaining = Math.max(0, durationSec - elapsed);
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
        const newExId = duelData.exercise.id;
        const newVars = duelData.exercise_data?.variables ?? {};
        const prevExId = currentExerciseIdRef.current;

        // If exercise changed and we had a previous exercise, show its correction briefly (unless we just solved it)
        if (
          !skipCorrection &&
          prevExId != null &&
          newExId !== prevExId &&
          currentExerciseRef.current &&
          Object.keys(currentVariablesRef.current).length > 0
        ) {
          const correction = getCorrectionFromExercise(
            currentExerciseRef.current,
            currentVariablesRef.current,
          );
          if (correction) {
            setMissedCorrection(correction);
          }
        }

        currentExerciseIdRef.current = newExId;
        currentExerciseRef.current = fullExercise;
        currentVariablesRef.current = newVars;

        setExercise(fullExercise);
        if (Object.keys(newVars).length > 0) {
          setVariables(newVars);
        }

        // Reset per-exercise timer when a new exercise is loaded
        if (duelData.status === "active") {
          setExerciseStartTime(Date.now());
          const exStarted = (duelData.exercise_data as { started_at?: string } | undefined)?.started_at;
          if (exStarted) {
            const elapsed = Math.floor((Date.now() - new Date(exStarted).getTime()) / 1000);
            setExerciseRemainingSeconds(Math.max(0, exerciseTimeoutSec - elapsed));
          } else {
            setExerciseRemainingSeconds(exerciseTimeoutSec);
          }
        }
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      console.error("[ActiveDuel] loadDuel error:", message, error);
      const is404 = message.includes("404") || message.includes("introuvable");
      if (is404) {
        router.push("/duel");
      } else {
        alert(message || "Erreur lors du chargement du duel");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [duelId, router, durationSec, exerciseTimeoutSec]);

  useEffect(() => {
    duelsApi.getDuelConfig().then(setDuelConfig).catch(() => {});
  }, []);

  // Load duel data
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    loadDuel();
  }, [duelId, user, router, loadDuel]);

  // Subscribe to realtime updates (refresh full duel so exercise/variables stay in sync)
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
        () => {
          loadDuel(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duelId, duel, loadDuel]);

  // Poll every 10s so backend can advance to next exercise after timeout (no score)
  useEffect(() => {
    if (!duel || duel.status !== "active") return;
    const t = setInterval(() => loadDuel(true), 10000);
    return () => clearInterval(t);
  }, [duel?.id, duel?.status, loadDuel]);

  // Hide missed correction after N seconds
  useEffect(() => {
    if (!missedCorrection) return;
    const t = setTimeout(() => setMissedCorrection(null), correctionDisplaySec * 1000);
    return () => clearTimeout(t);
  }, [missedCorrection, correctionDisplaySec]);

  // Local countdown timer based on duel.started_at
  useEffect(() => {
    if (!duel || !duel.started_at || duel.status !== "active") return;

    const tick = () => {
      const startedAt = new Date(duel.started_at as string).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, durationSec - elapsed);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setForceFinished(true);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [duel, durationSec]);

  // Per-exercise countdown: from exercise_data.started_at
  useEffect(() => {
    if (!duel || duel.status !== "active") return;
    const startedAtStr = (duel.exercise_data as { started_at?: string } | undefined)?.started_at;
    if (!startedAtStr) return;

    const tick = () => {
      const startedAt = new Date(startedAtStr).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, exerciseTimeoutSec - elapsed);
      setExerciseRemainingSeconds(remaining);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [duel?.id, duel?.status, (duel?.exercise_data as { started_at?: string } | undefined)?.started_at, exerciseTimeoutSec]);

  const applyDuelData = useCallback(
    (duelData: Duel, opts: { exerciseTimeoutSec: number; durationSec: number }) => {
      setDuel(duelData);
      if (duelData.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(duelData.started_at).getTime()) / 1000);
        const remaining = Math.max(0, opts.durationSec - elapsed);
        setRemainingSeconds(remaining);
        setForceFinished(remaining <= 0 || duelData.status === "finished");
      }
      if (duelData.exercise) {
        const c = duelData.exercise.content;
        const fullExercise: Exercise = {
          id: duelData.exercise.id,
          title: duelData.exercise.title,
          app_title: duelData.exercise.app_title || duelData.exercise.title,
          chapter: duelData.exercise.chapter,
          difficulty: duelData.exercise.difficulty,
          competences: [],
          variables: c?.variables || [],
          elements: c?.elements || [],
        };
        const newVars = (duelData.exercise_data as { variables?: VariableValues } | undefined)?.variables ?? {};
        currentExerciseIdRef.current = duelData.exercise.id;
        currentExerciseRef.current = fullExercise;
        currentVariablesRef.current = newVars;
        setExercise(fullExercise);
        setVariables(newVars);
        if (duelData.status === "active") {
          setExerciseStartTime(Date.now());
          const exStarted = (duelData.exercise_data as { started_at?: string } | undefined)?.started_at;
          if (exStarted) {
            const elapsed = Math.floor((Date.now() - new Date(exStarted).getTime()) / 1000);
            setExerciseRemainingSeconds(Math.max(0, opts.exerciseTimeoutSec - elapsed));
          } else {
            setExerciseRemainingSeconds(opts.exerciseTimeoutSec);
          }
        }
      }
    },
    [],
  );

  const handleAnswerSubmit = useCallback(
    async (answer: string, isCorrect: boolean) => {
      if (!exercise || !duel) return;
      if (duel.status === "finished" || forceFinished) return;
      if (isCorrect && submittingCorrectRef.current) return;
      if (isCorrect) submittingCorrectRef.current = true;

      const now = Date.now();
      const start = exerciseStartTime != null && Number.isFinite(exerciseStartTime) && exerciseStartTime > 0 ? exerciseStartTime : null;
      let timeSpent = start != null ? now - start : 0;
      if (Number.isNaN(timeSpent) || timeSpent < 0 || timeSpent > 600_000) {
        timeSpent = 0;
      } else {
        timeSpent = Math.floor(Math.min(timeSpent, 600_000));
      }

      try {
        const result = await duelsApi.submitAnswer(
          duelId,
          exercise.elements[0].id,
          answer,
          isCorrect,
          timeSpent,
        );

        if (result.duel) {
          setDuel(result.duel);
          if (isCorrect && result.duel.exercise) {
            applyDuelData(result.duel, { exerciseTimeoutSec, durationSec });
          } else if (isCorrect) {
            await loadDuel(false, true);
          }
        }
      } catch (error: any) {
        console.error("Error submitting answer:", error);
        alert(error.message || "Erreur lors de la soumission de la réponse");
      } finally {
        if (isCorrect) submittingCorrectRef.current = false;
      }
    },
    [exercise, duel, duelId, exerciseStartTime, forceFinished, loadDuel, applyDuelData, exerciseTimeoutSec],
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

  const totalDurationSeconds = durationSec;
  const safeRemaining = Math.max(0, remainingSeconds);
  const exerciseSecondsLeft = Math.max(0, exerciseRemainingSeconds);
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
              {/* Brief correction when moving to next exercise without solving */}
              {missedCorrection && (
                <div
                  className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  <p className="text-sm font-semibold text-amber-300 mb-1">
                    Correction (exercice précédent)
                  </p>
                  <p className="text-white">
                    <span className="text-amber-200/90">Bonne réponse : </span>
                    <MathText
                      content={substituteVariables(missedCorrection.correctAnswer, missedCorrection.variables)}
                      variables={{}}
                      autoLatex={true}
                    />
                  </p>
                  {missedCorrection.explanation && (
                    <p className="text-sm text-slate-300 mt-2">
                      <MathText
                        content={substituteVariables(missedCorrection.explanation, missedCorrection.variables)}
                        variables={{}}
                        autoLatex={true}
                      />
                    </p>
                  )}
                </div>
              )}
              {/* Exercise */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h2
                      className="text-white text-2xl"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                    >
                      {exercise.title}
                    </h2>
                    <span
                      className="bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-sm tabular-nums"
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      Question : {Math.floor(exerciseSecondsLeft / 60)}:{(exerciseSecondsLeft % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
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
                      // Use expression (answer or correctAnswer) so checkAnswer evaluates with variables
                      const questionContent = element.content as any;
                      const answerExpr =
                        questionContent.answer ??
                        questionContent.correctAnswer ??
                        "";
                      let correctAnswerStr = answerExpr.trim();
                      if (correctAnswerStr) {
                        try {
                          const numericVars: Record<string, number> = {};
                          Object.keys(variables).forEach((varName) => {
                            const val = variables[varName];
                            numericVars[varName] =
                              typeof val === "number"
                                ? val
                                : parseFloat(String(val));
                          });
                          const computed = evaluate(answerExpr, numericVars);
                          if (computed !== undefined && !Number.isNaN(computed)) {
                            correctAnswerStr = String(computed);
                          }
                        } catch (e) {
                          console.warn("[duel] evaluate answer:", e);
                        }
                      }
                      if (!correctAnswerStr) {
                        console.warn(
                          "[duel] No correctAnswer for question element",
                          element.id,
                          questionContent,
                        );
                      }
                      const rawFormat =
                        questionContent.answerFormat ??
                        questionContent.answerType ??
                        "number";
                      const answerFormat =
                        rawFormat === "numeric" ? "number" : rawFormat;

                      return (
                        <QuestionRenderer
                          key={element.id}
                          content={{
                            ...questionContent,
                            correctAnswer: correctAnswerStr,
                            answerFormat,
                          }}
                          variables={variables}
                          onSubmit={handleAnswerSubmit}
                          maxAttempts={999}
                          allowHint={false}
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
                  {`Pendant ${Math.floor(durationSec / 60)} min, enchaîne les exercices. Premier à répondre correctement = +1 point.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
