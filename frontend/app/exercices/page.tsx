"use client";

import { BookOpen, Sparkles } from "lucide-react";
import { useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ExerciseLoader } from "../components/Exercise/ExerciseLoader";
import { Layout } from "../components/Layout";
import { Exercise } from "../types/exercise";

// Composant qui lit l'URL
function ExercisePageContent() {
  const [error, setError] = useState<string | null>(null);
  
  // 1. On récupère les paramètres de l'URL
  const searchParams = useSearchParams();
  
  // 2. On extrait l'ID (ex: "14"). 
  // S'il n'y en a pas, on laisse undefined (le Loader chargera le premier dispo).
  const exerciseId = searchParams.get('id') || undefined;

  // Stabiliser les callbacks pour éviter les re-renders
  const handleLoad = useCallback((exercise: Exercise) => {
    // Exercise loaded successfully
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('[ExercisePage] Load error:', err.message);
    setError(err.message);
  }, []);

  const handleElementSubmit = useCallback((elementId: number, answer: unknown, isCorrect: boolean) => {
    // Element submitted
  }, []);

  return (
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
          
          {/* 3. On passe l'ID dynamique au Loader */}
          <ExerciseLoader
            exerciseId={exerciseId}
            onLoad={handleLoad}
            onError={handleError}
            onElementSubmit={handleElementSubmit}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <p className="text-red-200 text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
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
          <p className="text-blue-200 text-xs leading-relaxed" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            {exerciseId 
              ? `Exercice #${exerciseId} chargé depuis la base de données` 
              : "Mode découverte (Exercice automatique)"}
          </p>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(51, 65, 85, 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.7); }
      `}</style>
    </div>
  );
}

// Export principal avec Suspense (OBLIGATOIRE pour lire l'URL)
export default function ExercicesPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="text-white text-center p-10">Chargement de la page...</div>}>
        <ExercisePageContent />
      </Suspense>
    </Layout>
  );
}