'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { EquationContent, RendererProps } from '../types/exercise';
import { MathText } from '../components/ui';
import { substituteVariables } from '../utils/math/parsing';
import { checkAnswer } from '../utils/math/evaluation';

interface EquationRendererProps extends RendererProps<EquationContent> {
  onSubmit?: (answer: string, isCorrect: boolean) => void;
}

const EquationRenderer: React.FC<EquationRendererProps> = ({
  content,
  variables,
  onSubmit,
}) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setAnswer('');
    setFeedback(null);
    setIsSubmitted(false);
  }, [variables]);

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) {
      setFeedback({ type: 'warning', message: 'Veuillez entrer une réponse.' });
      return;
    }

    if (content.requireAnswer && content.correctAnswer) {
      // 1. Calculer la réponse attendue en substituant les variables
      const expectedAnswer = substituteVariables(content.correctAnswer, variables);
      
      // 2. Vérification (Numeric ou Textuelle)
      // Note: Pour les équations complexes (ensembles {x,y}), checkAnswer gère le basique.
      // Si vous avez besoin de vérifier des ensembles, la logique précédente peut être réintégrée dans checkAnswer.
      // Ici on utilise une comparaison souple.
      const isCorrect = checkAnswer(answer, expectedAnswer, variables, content.answerType === 'numeric' ? 'number' : 'text');

      setFeedback({
        type: isCorrect ? 'success' : 'error',
        message: isCorrect
          ? '✓ Bravo ! Bonne réponse !'
          : `✗ Incorrect. La réponse était : ${expectedAnswer}`,
      });
      setIsSubmitted(true);
      onSubmit?.(answer, isCorrect);
    } else {
      setFeedback({ type: 'info', message: 'Réponse enregistrée.' });
      onSubmit?.(answer, true);
    }
  }, [answer, content, variables, onSubmit]);

  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      <div className="bg-blue-50 rounded-xl p-6 flex justify-center mb-4">
        <MathText
          content={`$$${content.latex}$$`}
          variables={variables}
          displayMode={true}
          className="text-xl text-gray-800"
        />
      </div>

      {content.requireAnswer && (
        <>
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitted && handleSubmit()}
              disabled={isSubmitted}
              className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-2 border-gray-200 
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                         disabled:opacity-50 transition-all"
              placeholder={content.answerType === 'set' ? 'Ex: {1; 2}' : 'Votre réponse...'}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitted}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              Vérifier
            </button>
          </div>

          {feedback && (
            <div className={`mt-4 p-4 rounded-xl border ${
              feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {feedback.message}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EquationRenderer;