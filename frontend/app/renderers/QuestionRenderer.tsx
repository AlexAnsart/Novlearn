'use client';

import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { MathText } from '../components/ui';
import { VariableValues } from '../types/exercise';
import { checkAnswer } from '../utils/math/evaluation';

interface QuestionContent {
  question: string;
  correctAnswer: string;
  answerFormat: 'number' | 'text';
  points?: number;
  hint?: string;
  explanation?: string;
}

interface QuestionRendererProps {
  elementId: number;
  content: QuestionContent;
  variables: VariableValues;
  onElementSubmit?: (id: number, answer: string, isCorrect: boolean) => void;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  elementId,
  content,
  variables,
  onElementSubmit
}) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // Vérification de la réponse via le moteur d'évaluation
    const isCorrect = checkAnswer(value, content.correctAnswer, variables, content.answerFormat);
    
    setStatus(isCorrect ? 'correct' : 'incorrect');
    
    if (onElementSubmit) {
      onElementSubmit(elementId, value, isCorrect);
    }
  };

  return (
    <div className="my-6 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Énoncé de la question */}
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">
          ?
        </div>
        <div className="flex-grow pt-1">
          <MathText 
            content={content.question} 
            variables={variables} 
            className="font-medium text-lg text-slate-800"
          />
        </div>
        {content.points && (
          <div className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md h-fit">
            {content.points} pt{content.points > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Formulaire de réponse */}
      <form onSubmit={handleSubmit} className="space-y-4 ml-11">
        <div className="flex gap-3 items-start max-w-md">
          <input
            type={content.answerFormat === 'number' ? "text" : "text"}
            inputMode={content.answerFormat === 'number' ? "decimal" : "text"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status !== 'idle') setStatus('idle'); // Reset status on change
            }}
            placeholder="Votre réponse..."
            className={`flex-grow px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition-all
              ${status === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                status === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' : 
                'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'}`}
            disabled={status === 'correct'} // Désactiver si trouvé
          />
          
          <button
            type="submit"
            disabled={!value || status === 'correct'}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Valider
          </button>
        </div>

        {/* Feedback */}
        {status === 'correct' && (
          <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-left-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Bonne réponse !</span>
          </div>
        )}

        {status === 'incorrect' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Mauvaise réponse, essayez encore.</span>
            </div>
            
            {content.hint && !showHint && (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
              >
                <HelpCircle className="w-4 h-4" />
                Besoin d'un indice ?
              </button>
            )}
          </div>
        )}

        {/* Indice */}
        {showHint && content.hint && (
          <div className="p-3 bg-indigo-50 text-indigo-800 text-sm rounded-lg border border-indigo-100 flex gap-2">
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <MathText content={content.hint} variables={variables} />
          </div>
        )}
      </form>
    </div>
  );
};

export default QuestionRenderer;