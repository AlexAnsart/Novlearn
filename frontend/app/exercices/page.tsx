"use client";

import { BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { ExerciseLoader } from "../components/Exercise";
import { Layout } from "../components/Layout";

export default function ExercicesPage() {
  const [error, setError] = useState<string | null>(null);

  // ID de l'exercice présent dans /data
  const exerciseId = "analyse_equation_de_degre_2_1_rgyfpt";

  return (
    <Layout>
      <div className="flex-1 flex flex-col px-4 md:px-8 py-6 max-w-[1400px] mx-auto w-full">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Exercice de mathématiques
            </h1>
          </div>
          <p
            className="text-center text-blue-200 text-base"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Résolvez l'exercice ci-dessous
          </p>
        </div>

        {/* Zone d'exercice */}
        <div className="flex-1">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] p-6 md:p-8">
            <ExerciseLoader
              exerciseId={exerciseId}
              dataPath="/data"
              onLoad={(exercise) => {
                console.log("Exercice chargé:", exercise);
              }}
              onError={(err) => {
                console.error("Erreur de chargement:", err);
                setError(err.message);
              }}
              onElementSubmit={(elementId, answer, isCorrect) => {
                console.log("Réponse soumise:", {
                  elementId,
                  answer,
                  isCorrect,
                });
              }}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p
                  className="text-red-200 text-sm"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  ❌ {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="mt-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p
              className="text-blue-200 text-xs leading-relaxed"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
            >
              Cet exercice est chargé depuis{" "}
              <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-blue-300">
                /public/data/{exerciseId}.json
              </code>
            </p>
          </div>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(51, 65, 85, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
          }
        `}</style>
      </div>
    </Layout>
  );
}
