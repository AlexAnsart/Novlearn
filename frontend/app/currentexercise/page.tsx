'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';
import { TableVariationExercise } from '../components/TableVariationExercise';
import { ExponentialExercise } from '../components/ExponentialExercise';
import { ValidationResult } from '../components/ValidationResult';

type ExerciseType = "table" | "exponential";
type ValidationStatus = "correct" | "partial" | "incorrect" | null;

export default function TrainingPage() {
  const router = useRouter();
  const [currentExercise, setCurrentExercise] = useState<ExerciseType>("table");
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);

  const handleValidate = (answers: string[], isCorrect: boolean, isPartial: boolean) => {
    if (isCorrect) {
      setValidationStatus("correct");
    } else if (isPartial) {
      setValidationStatus("partial");
    } else {
      setValidationStatus("incorrect");
    }
  };

  const handleSkip = () => {
    setCurrentExercise((prev) => (prev === "table" ? "exponential" : "table"));
    setValidationStatus(null);
  };

  const handleNewExercise = () => {
    setCurrentExercise((prev) => (prev === "table" ? "exponential" : "table"));
    setValidationStatus(null);
  };

  return (
    <Layout isFullScreen>
      {/* Header avec Logo et bouton "Vérifier le cours" */}
      <div className="p-8 flex items-center justify-between">
        <Logo />

        <button
          onClick={() => router.push('/cours')}
          className="relative px-8 py-4 rounded-3xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_8px_0_0_rgb(109,40,217),0_13px_20px_rgba(147,51,234,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_4px_0_0_rgb(109,40,217),0_6px_15px_rgba(147,51,234,0.3)] active:translate-y-1"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
        >
          📚 Vérifier le cours
        </button>
      </div>

      {/* Exercice */}
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="max-w-4xl w-full">
          {currentExercise === "table" && (
            <TableVariationExercise onValidate={handleValidate} onSkip={handleSkip} />
          )}
          {currentExercise === "exponential" && (
            <ExponentialExercise onValidate={handleValidate} onSkip={handleSkip} />
          )}
        </div>
      </div>

      {/* Validation Result Overlay */}
      {validationStatus && <ValidationResult status={validationStatus} onNewExercise={handleNewExercise} />}
    </Layout>
  );
}
