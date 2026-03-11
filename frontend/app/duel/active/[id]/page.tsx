"use client";

import { Trophy, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "../../../components/Layout";
import MathText from "../../../components/ui/MathText";
import { useAuth } from "../../../contexts/AuthContext";
import { getColyseusClient } from "../../../lib/colyseusClient";
import QuestionRenderer from "../../../renderers/QuestionRenderer";
import { Exercise, TextContent, VariableValues } from "../../../types/exercise";
import { evaluate } from "../../../utils/math/evaluation";
import { substituteVariables } from "../../../utils/math/parsing";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseMsg {
  exercise: {
    id: number;
    title: string;
    chapter: string;
    difficulty: string;
    content: { variables: unknown[]; elements: unknown[] };
  };
  variables: VariableValues;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildExercise(raw: ExerciseMsg["exercise"]): Exercise {
  return {
    id: raw.id,
    title: raw.title,
    app_title: raw.title,
    chapter: raw.chapter,
    difficulty: raw.difficulty,
    competences: [],
    variables: (raw.content?.variables ?? []) as Exercise["variables"],
    elements: (raw.content?.elements ?? []) as Exercise["elements"],
  };
}

function computeCorrectAnswer(expr: string, vars: VariableValues): string {
  if (!expr.trim()) return expr;
  try {
    const numVars: Record<string, number> = {};
    Object.entries(vars).forEach(([k, v]) => {
      numVars[k] = typeof v === "number" ? v : parseFloat(String(v));
    });
    const computed = evaluate(expr, numVars);
    if (computed !== undefined && !Number.isNaN(computed)) return String(computed);
  } catch { /* keep raw */ }
  return expr.trim();
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActiveDuelPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const duelId = parseInt(params.id as string);

  const roomRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [phase, setPhase] = useState("waiting");
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Id, setP1Id] = useState("");
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [duelStartedAt, setDuelStartedAt] = useState(0);
  const [exStartedAt, setExStartedAt] = useState(0);
  const [duelDuration, setDuelDuration] = useState(300);
  const [exTimeout, setExTimeout] = useState(45);
  const [correctionSec, setCorrectionSec] = useState(5);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [correction, setCorrection] = useState<string | null>(null);
  const exerciseCountRef = useRef(0);
  const submittingRef = useRef(false);

  const [globalRemaining, setGlobalRemaining] = useState(300);
  const [exRemaining, setExRemaining] = useState(45);

  // ─── Connect ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }

    let cancelled = false;

    async function connect() {
      try {
        console.log("[Duel] connecting…", { duelId });
        const { supabase } = await import("../../../lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const client = getColyseusClient();

        const room = await client.joinOrCreate("duel_room", {
          token: session.access_token,
          duelId,
        });

        if (cancelled) { room.leave(); return; }
        roomRef.current = room;
        console.log("[Duel] joined room", { roomId: room.id, sessionId: room.sessionId });

        // ── State sync ────────────────────────────────────────────────────
        room.onStateChange((state: any) => {
          if (!state) return;
          setPhase(state.phase);
          setP1Score(state.player1Score);
          setP2Score(state.player2Score);
          setP1Id(state.player1Id);
          setP1Name(state.player1Name);
          setP2Name(state.player2Name);
          setWinnerId(state.winnerId);
          setDuelStartedAt(state.duelStartedAt);
          setExStartedAt(state.exerciseStartedAt);
          setDuelDuration(state.duelDurationSeconds);
          setExTimeout(state.exerciseTimeoutSeconds);
          setCorrectionSec(state.correctionDisplaySeconds);
        });

        // ── Exercise (sent by server when game starts and after each solve/timeout) ──
        const handleExercise = (msg: ExerciseMsg) => {
          console.log("[Duel] exercise received", {
            id: msg.exercise.id,
            title: msg.exercise.title,
          });
          exerciseCountRef.current++;
          submittingRef.current = false;
          setCorrection(null);
          setExercise(buildExercise(msg.exercise));
          setVariables(msg.variables ?? {});
          setConnected(true);
        };

        // New message name used by the rewritten duel-server
        room.onMessage("exercise", handleExercise);
        // Backwards-compatibility with older room code that still emits "exercise_loaded"
        room.onMessage("exercise_loaded", handleExercise);

        // ── Someone scored ──────────────────────────────────────────────────
        room.onMessage("point_scored", (_msg: { scoredBy: string }) => {
          console.log("[Duel] point_scored");
        });

        // ── Exercise timed out (nobody solved) ──────────────────────────────
        room.onMessage("exercise_timeout", (msg: { correctAnswer: { expression: string; elementId: number } | null }) => {
          console.log("[Duel] exercise_timeout");
          if (msg.correctAnswer?.expression) {
            setCorrection(msg.correctAnswer.expression);
          }
        });

        room.onLeave((code: number) => {
          console.warn("[Duel] onLeave", { code });
        });

        room.onError((code: number, message?: string) => {
          console.error("[Duel] onError", { code, message });
          if (!cancelled) setLoadError(`Erreur serveur (${code}): ${message}`);
        });

        // Tell server we're ready (all handlers are registered)
        room.send("ready", {});
        console.log("[Duel] sent ready");

      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Duel] connect error:", msg);
        if (msg.includes("404") || msg.includes("not found")) {
          router.push("/duel");
        } else {
          setLoadError(msg || "Impossible de rejoindre le duel.");
        }
      }
    }

    connect();
    return () => { cancelled = true; roomRef.current?.leave(); roomRef.current = null; };
  }, [duelId, user, router]);

  // ─── Timers ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!duelStartedAt || phase !== "playing") return;
    const tick = () => setGlobalRemaining(Math.max(0, duelDuration - (nowSec() - duelStartedAt)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [duelStartedAt, phase, duelDuration]);

  useEffect(() => {
    if (!exStartedAt || phase !== "playing") return;
    const tick = () => setExRemaining(Math.max(0, exTimeout - (nowSec() - exStartedAt)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [exStartedAt, phase, exTimeout]);

  useEffect(() => {
    if (!correction) return;
    const id = setTimeout(() => setCorrection(null), correctionSec * 1000);
    return () => clearTimeout(id);
  }, [correction, correctionSec]);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleAnswerSubmit = useCallback(
    (answer: string, isCorrect: boolean) => {
      const room = roomRef.current;
      if (!room || !exercise || phase !== "playing") return;
      if (isCorrect && submittingRef.current) return;
      if (isCorrect) submittingRef.current = true;

      const questionEl = exercise.elements.find((el) => el.type === "question");
      const elementId = questionEl?.id ?? exercise.elements[0]?.id ?? 0;

      let timeSpent = exStartedAt > 0 ? (Date.now() - exStartedAt * 1000) : 0;
      if (timeSpent < 0 || timeSpent > 600_000) timeSpent = 0;

      room.send("submitAnswer", { elementId, answer, isCorrect, timeSpent: Math.floor(timeSpent) });
    },
    [exercise, phase, exStartedAt],
  );

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isP1 = user?.id === p1Id;
  const myScore = isP1 ? p1Score : p2Score;
  const opponentScore = isP1 ? p2Score : p1Score;
  const myName = isP1 ? p1Name : p2Name;
  const opponentName = isP1 ? p2Name : p1Name;

  const safeGlobal = Math.max(0, globalRemaining);
  const mm = Math.floor(safeGlobal / 60);
  const ss = safeGlobal % 60;
  const formattedTime = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  const duelFinished = phase === "finished" || safeGlobal === 0;

  const exMm = Math.floor(Math.max(0, exRemaining) / 60);
  const exSs = Math.max(0, exRemaining) % 60;

  let finalTitle = "Duel terminé";
  let finalSub = "";
  if (myScore > opponentScore) { finalTitle = "Victoire !"; finalSub = "Bravo, tu as remporté ce duel."; }
  else if (myScore < opponentScore) { finalTitle = "Défaite"; finalSub = "Ce n'est que partie remise, retente ta chance !"; }
  else { finalTitle = "Égalité"; finalSub = "Vous êtes au coude-à-coude, qui gagnera la prochaine fois ?"; }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-300 text-xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>{loadError}</p>
            <button onClick={() => router.push("/duel")} className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" style={{ fontFamily: "'Fredoka', sans-serif" }}>Retour aux duels</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!connected || !exercise) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
              {phase === "waiting" ? "En attente de l'adversaire…" : "Connexion au duel…"}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Scoreboard */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center"><Trophy className="w-8 h-8 text-white" /></div>
                <div>
                  <p className="text-white text-lg" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{myName || "Vous"}</p>
                  <p className="text-blue-200 text-3xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{myScore}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-4xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>VS</p>
                <div className="flex flex-col items-center gap-1 mt-2 text-yellow-300">
                  <div className="flex items-center gap-2"><Zap className="w-5 h-5" /><p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>{duelFinished ? "Duel terminé" : "En direct"}</p></div>
                  <p className="text-sm text-yellow-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>Temps restant : {formattedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center"><Trophy className="w-8 h-8 text-white" /></div>
                <div className="text-right">
                  <p className="text-white text-lg" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{opponentName || "Adversaire"}</p>
                  <p className="text-purple-200 text-3xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{opponentScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Finished */}
          {duelFinished ? (
            <div className="bg-slate-900/70 backdrop-blur-sm rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="text-center space-y-3">
                <h2 className="text-3xl text-white" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{finalTitle}</h2>
                <p className="text-slate-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>{finalSub}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-10">
                <div className="text-center"><p className="text-sm text-slate-300 mb-1">Vous</p><p className="text-3xl text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{myScore}</p></div>
                <div className="text-slate-400 text-lg">-</div>
                <div className="text-center"><p className="text-sm text-slate-300 mb-1">{opponentName}</p><p className="text-3xl text-purple-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{opponentScore}</p></div>
              </div>
              <div className="mt-8 flex justify-center">
                <button onClick={() => router.push("/duel")} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform" style={{ fontFamily: "'Fredoka', sans-serif" }}>Retour aux duels</button>
              </div>
            </div>
          ) : (
            <>
              {/* Correction banner */}
              {correction && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  <p className="text-sm font-semibold text-amber-300 mb-1">Correction (exercice précédent)</p>
                  <p className="text-white">
                    <span className="text-amber-200/90">Bonne réponse : </span>
                    <MathText content={substituteVariables(correction, variables)} variables={{}} autoLatex={true} />
                  </p>
                </div>
              )}

              {/* Exercise */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h2 className="text-white text-2xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>{exercise.title}</h2>
                    <span className="bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-sm tabular-nums" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                      Question : {exMm}:{exSs.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>{exercise.chapter}</span>
                    <span className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>{exercise.difficulty}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {exercise.elements.map((element) => {
                    if (element.type === "text") {
                      return (
                        <div key={element.id} className="text-white text-lg">
                          <MathText content={(element.content as TextContent).text} variables={variables} autoLatex={true} />
                        </div>
                      );
                    }
                    if (element.type === "question") {
                      const q = element.content as any;
                      const answerExpr = (q.answer ?? q.correctAnswer ?? "").trim();
                      const correctAnswerStr = computeCorrectAnswer(answerExpr, variables);
                      const rawFormat = q.answerFormat ?? q.answerType ?? "number";
                      const answerFormat = rawFormat === "numeric" ? "number" : rawFormat;

                      return (
                        <QuestionRenderer
                          key={`${exercise.id}-${element.id}`}
                          content={{ ...q, correctAnswer: correctAnswerStr, answerFormat }}
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

              <div className="text-center">
                <p className="text-blue-200 text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
                  {`Pendant ${Math.floor(duelDuration / 60)} min, enchaîne les exercices. Premier à répondre correctement = +1 point.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
