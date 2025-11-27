'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';
import { ExerciseLoader } from '../components/exercise';
import { ValidationResult } from '../components/ValidationResult';

type ValidationStatus = "correct" | "partial" | "incorrect" | null;

export default function TrainingPage() {
  const router = useRouter();
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);
  const [exerciseKey, setExerciseKey] = useState(0); // Pour forcer le rechargement

  // Gestion de la soumission d'un élément
  const handleElementSubmit = useCallback((elementId: number, answer: unknown, isCorrect: boolean) => {
    console.log(`Element ${elementId}:`, answer, isCorrect);
    
    // Pour l'instant, on affiche le résultat pour les questions et QCM
    if (isCorrect) {
      setValidationStatus("correct");
    } else {
      setValidationStatus("incorrect");
    }
  }, []);

  // Nouvel exercice (régénère les variables)
  const handleNewExercise = useCallback(() => {
    setValidationStatus(null);
    setExerciseKey(prev => prev + 1);
  }, []);

  // Passer l'exercice
  const handleSkip = useCallback(() => {
    setValidationStatus(null);
    setExerciseKey(prev => prev + 1);
  }, []);

  return (
    <Layout isFullScreen>
      {/* Header avec Logo et boutons */}
      <div className="p-8 flex items-center justify-between">
        <Logo />

        <div className="flex items-center gap-4">
          {/* Bouton Passer */}
          <button
            onClick={handleSkip}
            className="relative px-6 py-3 rounded-2xl bg-gradient-to-b from-gray-500 to-gray-700 text-white shadow-[0_4px_0_0_rgb(55,65,81),0_8px_15px_rgba(107,114,128,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_2px_0_0_rgb(55,65,81),0_4px_10px_rgba(107,114,128,0.3)] active:translate-y-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1rem" }}
          >
            ⏭️ Passer
          </button>

          {/* Bouton Vérifier le cours */}
          <button
            onClick={() => router.push('/cours')}
            className="relative px-8 py-4 rounded-3xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_8px_0_0_rgb(109,40,217),0_13px_20px_rgba(147,51,234,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_4px_0_0_rgb(109,40,217),0_6px_15px_rgba(147,51,234,0.3)] active:translate-y-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
          >
            📚 Vérifier le cours
          </button>
        </div>
      </div>

      {/* Exercice */}
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="max-w-4xl w-full">
          <ExerciseLoader
            key={exerciseKey}
            exerciseId="exemple-analyse"
            dataPath="/data/exercises"
            onElementSubmit={handleElementSubmit}
          />
        </div>
      </div>

      {/* Validation Result Overlay */}
      {validationStatus && (
        <ValidationResult 
          status={validationStatus} 
          onNewExercise={handleNewExercise} 
        />
      )}
    </Layout>
  );
}