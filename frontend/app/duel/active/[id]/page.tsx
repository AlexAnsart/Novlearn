'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '../../../components/Layout';
import { duelsApi, Duel } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { Exercise, VariableValues, TextContent } from '../../../types/exercise';
import { Trophy, Clock, Zap } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import QuestionRenderer from '../../../renderers/QuestionRenderer';
import MathText from '../../../components/ui/MathText';

export default function ActiveDuelPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const duelId = parseInt(params.id as string);

  const [duel, setDuel] = useState<Duel | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  // Load duel data
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadDuel();
  }, [duelId, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!duel) return;

    const channel = supabase
      .channel(`duel:${duelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duels',
          filter: `id=eq.${duelId}`,
        },
        (payload) => {
          console.log('Duel updated:', payload);
          setDuel(payload.new as Duel);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duelId, duel]);

  const loadDuel = async () => {
    try {
      setLoading(true);
      const { duel: duelData } = await duelsApi.getDuel(duelId);
      setDuel(duelData);

      // Load exercise
      if (duelData.exercise) {
        const exerciseContent = duelData.exercise.content;
        const fullExercise: Exercise = {
          id: duelData.exercise.id,
          title: duelData.exercise.title,
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
      }
    } catch (error: any) {
      console.error('Error loading duel:', error);
      alert(error.message || 'Erreur lors du chargement du duel');
      router.push('/duel');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = useCallback(
    async (answer: string, isCorrect: boolean) => {
      if (!exercise || !duel) return;

      const timeSpent = Date.now() - startTime;

      try {
        const result = await duelsApi.submitAnswer(
          duelId,
          exercise.elements[0].id, // Pour l'instant, on utilise le premier élément
          answer,
          isCorrect,
          timeSpent
        );

        if (result.duel) {
          setDuel(result.duel);
        }

        // Si la réponse est correcte, on recharge l'exercice pour avoir de nouvelles variables
        if (isCorrect) {
          await loadDuel();
        }
      } catch (error: any) {
        console.error('Error submitting answer:', error);
        alert(error.message || 'Erreur lors de la soumission de la réponse');
      }
    },
    [exercise, duel, duelId, startTime]
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
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
            <p className="text-red-200 text-xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>
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
    ? `${duel.player2?.profiles?.[0]?.first_name || duel.player2?.email?.split('@')[0] || 'Adversaire'}`
    : `${duel.player1?.profiles?.[0]?.first_name || duel.player1?.email?.split('@')[0] || 'Adversaire'}`;

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
                  <p className="text-white text-lg" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
                    {isPlayer1 ? 'Vous' : opponentName}
                  </p>
                  <p className="text-blue-200 text-3xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
                    {isPlayer1 ? myScore : opponentScore}
                  </p>
                </div>
              </div>

              {/* VS */}
              <div className="text-center">
                <p className="text-white text-4xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
                  VS
                </p>
                <div className="flex items-center gap-2 mt-2 text-yellow-300">
                  <Zap className="w-5 h-5" />
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>En direct</p>
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-white text-lg" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
                    {isPlayer1 ? opponentName : 'Vous'}
                  </p>
                  <p className="text-purple-200 text-3xl" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
                    {isPlayer1 ? opponentScore : myScore}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="mb-6">
              <h2 className="text-white text-2xl mb-2" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
                {exercise.title}
              </h2>
              <div className="flex gap-2">
                <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  {exercise.chapter}
                </span>
                <span className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  {exercise.difficulty}
                </span>
              </div>
            </div>

            {/* Render exercise elements */}
            <div className="space-y-6">
              {exercise.elements.map((element) => {
                if (element.type === 'text') {
                  const textContent = element.content as TextContent;
                  return (
                    <div key={element.id} className="text-white text-lg">
                      <MathText
                        content={textContent.text}
                        variables={variables}
                        autoLatex={true}
                        requireBraces={true}
                      />
                    </div>
                  );
                } else if (element.type === 'question') {
                  // Calculate correct answer with variables
                  const questionContent = element.content as any;
                  let correctAnswer: number | undefined;
                  
                  if (questionContent.answerType === 'numeric' && questionContent.answer) {
                    // Replace variables in answer expression
                    let answerExpr = questionContent.answer;
                    Object.keys(variables).forEach((varName) => {
                      answerExpr = answerExpr.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(variables[varName]));
                    });
                    
                    try {
                      // Simple evaluation (for now, just handle basic arithmetic)
                      correctAnswer = eval(answerExpr);
                    } catch (e) {
                      console.error('Error evaluating answer:', e);
                    }
                  }

                  return (
                    <QuestionRenderer
                      key={element.id}
                      content={questionContent}
                      variables={variables}
                      correctAnswer={correctAnswer}
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
            <p className="text-blue-200 text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
              Premier à répondre correctement = +1 point
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
