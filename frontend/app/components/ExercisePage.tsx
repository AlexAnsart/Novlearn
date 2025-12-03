'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { ValidationResult } from './ValidationResult';
import { 
  Exercise, 
  VariableValues,
  TextContent,
  FunctionContent,
  EquationContent,
  VariationTableContent,
  SignTableContent,
  GraphContent,
  DiscreteGraphContent,
  QuestionContent,
  MCQContent,
  SequenceContent,
} from '../types/exercise';
import { generateVariables } from '../utils/variableGenerator';
import {
  TextRenderer,
  FunctionRenderer,
  EquationRenderer,
  VariationTableRenderer,
  SignTableRenderer,
  GraphRenderer,
  QuestionRenderer,
  MCQRenderer,
} from '../renderers';

type ValidationStatus = "correct" | "partial" | "incorrect" | null;

interface ExercisePageProps {
  exerciseId?: string;
}

export function ExercisePage({ exerciseId = 'exemple-analyse' }: ExercisePageProps) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);

  // Charger l'exercice
  const loadExercise = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/data/exercises/${exerciseId}.json`);
      
      if (!response.ok) {
        throw new Error(`Exercice non trouvé: ${exerciseId}`);
      }

      const data: Exercise = await response.json();
      setExercise(data);
      setVariables(generateVariables(data.variables));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('Erreur chargement exercice:', err);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  // Régénérer les variables (nouvel exercice)
  const handleNewExercise = useCallback(() => {
    if (exercise) {
      setVariables(generateVariables(exercise.variables));
    }
    setValidationStatus(null);
  }, [exercise]);

  // Passer l'exercice
  const handleSkip = useCallback(() => {
    handleNewExercise();
  }, [handleNewExercise]);

  // Gestion de la soumission d'un élément
  const handleElementSubmit = useCallback((answer: unknown, isCorrect: boolean) => {
    if (isCorrect) {
      setValidationStatus("correct");
    } else {
      setValidationStatus("incorrect");
    }
  }, []);

  // Rendu d'un élément selon son type
  const renderElement = (element: Exercise['elements'][0]) => {
    switch (element.type) {
      case 'text':
        return (
          <TextRenderer 
            key={element.id} 
            content={element.content as TextContent} 
            variables={variables} 
          />
        );
      
      case 'function':
        return (
          <FunctionRenderer 
            key={element.id} 
            content={element.content as FunctionContent} 
            variables={variables} 
          />
        );
      
      case 'equation':
        return (
          <EquationRenderer 
            key={element.id} 
            content={element.content as EquationContent} 
            variables={variables} 
          />
        );
      
      case 'variation_table':
        return (
          <VariationTableRenderer 
            key={element.id} 
            content={element.content as VariationTableContent} 
            variables={variables} 
          />
        );
      
      case 'sign_table':
        return (
          <SignTableRenderer 
            key={element.id} 
            content={element.content as SignTableContent} 
            variables={variables} 
          />
        );
      
      case 'graph':
        return (
          <GraphRenderer 
            key={element.id} 
            content={element.content as GraphContent} 
            variables={variables} 
          />
        );
      
      case 'question':
        return (
          <QuestionRenderer 
            key={element.id} 
            content={element.content as QuestionContent} 
            variables={variables}
            onSubmit={handleElementSubmit}
          />
        );
      
      case 'mcq':
        return (
          <MCQRenderer 
            key={element.id} 
            content={element.content as MCQContent} 
            variables={variables}
            onSubmit={(index, isCorrect) => handleElementSubmit(index, isCorrect)}
          />
        );
      
      default:
        return (
          <div 
            key={element.id}
            className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100 text-gray-500"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Type d'élément non supporté : {element.type}
          </div>
        );
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p 
            className="text-white"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Chargement de l'exercice...
          </p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="p-6 bg-red-500/20 backdrop-blur-sm rounded-2xl border border-red-500/30 max-w-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <p 
                className="text-white font-semibold"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Erreur de chargement
              </p>
              <p 
                className="text-red-200 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={loadExercise}
            className="mt-4 w-full px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Pas d'exercice
  if (!exercise) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p 
          className="text-gray-400"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          Aucun exercice à afficher
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header avec Logo et boutons */}
      <div className="p-4 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />

        <div className="flex items-center gap-3 md:gap-4">
          {/* Bouton Nouvelles valeurs */}
          <button
            onClick={handleNewExercise}
            className="relative px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_4px_0_0_rgb(109,40,217),0_6px_12px_rgba(147,51,234,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_2px_0_0_rgb(109,40,217),0_4px_8px_rgba(147,51,234,0.3)] active:translate-y-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "0.9rem" }}
          >
            🔄 Nouvelles valeurs
          </button>

          {/* Bouton Passer */}
          <button
            onClick={handleSkip}
            className="relative px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-gradient-to-b from-gray-500 to-gray-700 text-white shadow-[0_4px_0_0_rgb(55,65,81),0_6px_12px_rgba(107,114,128,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_2px_0_0_rgb(55,65,81),0_4px_8px_rgba(107,114,128,0.3)] active:translate-y-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "0.9rem" }}
          >
            ⏭️ Passer
          </button>

          {/* Bouton Vérifier le cours */}
          <button
            onClick={() => router.push('/cours')}
            className="relative px-4 md:px-8 py-2 md:py-4 rounded-2xl md:rounded-3xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_4px_0_0_rgb(29,78,216),0_6px_12px_rgba(37,99,235,0.3)] md:shadow-[0_8px_0_0_rgb(29,78,216),0_13px_20px_rgba(37,99,235,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_2px_0_0_rgb(29,78,216),0_4px_8px_rgba(37,99,235,0.3)] active:translate-y-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}
          >
            📚 Cours
          </button>
        </div>
      </div>

      {/* Titre de l'exercice */}
      <div className="px-4 md:px-8 mb-4">
        <h1 
          className="text-2xl md:text-3xl text-white text-center"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          {exercise.title}
        </h1>
        <p 
          className="text-blue-200 text-center mt-1"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
        >
          {exercise.chapter}
        </p>
      </div>

      {/* Contenu de l'exercice */}
      <div className="flex-1 px-4 md:px-8 pb-8 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {exercise.elements.map(renderElement)}
        </div>
      </div>

      {/* Validation Result Overlay */}
      {validationStatus && (
        <ValidationResult 
          status={validationStatus} 
          onNewExercise={handleNewExercise} 
        />
      )}
    </>
  );
}