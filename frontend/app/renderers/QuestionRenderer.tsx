'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { MathText } from '../components/ui';
import { VariableValues, QuestionContent } from '../types/exercise';
import { checkAnswer } from '../utils/math/evaluation';

// Interface harmonisée avec les autres Renderers (plus d'elementId requis ici)
interface QuestionRendererProps {
  content: QuestionContent;
  variables: VariableValues;
  onSubmit?: (answer: string, isCorrect: boolean) => void;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  content,
  variables,
  onSubmit
}) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // Utilisation des NOUVELLES propriétés (answerFormat et correctAnswer)
    const isCorrect = checkAnswer(value, content.correctAnswer, variables, content.answerFormat);
    
    setStatus(isCorrect ? 'correct' : 'incorrect');
    
    // On renvoie juste le résultat, le parent ajoutera l'ID
    if (onSubmit) {
      onSubmit(value, isCorrect);
    }
  };

  return (
    <div className="my-6 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
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

      <form onSubmit={handleSubmit} className="space-y-4 ml-11">
        <div className="flex gap-3 items-start max-w-md">
          <input
            type={content.answerFormat === 'number' ? "text" : "text"}
            inputMode={content.answerFormat === 'number' ? "decimal" : "text"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder="Votre réponse..."
            className={`flex-grow px-4 py-2 rounded-lg border outline-none transition-all
              ${status === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                status === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' : 
                'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-offset-1'}`}
            disabled={status === 'correct'}
          />
          
          <button
            type="submit"
            disabled={!value || status === 'correct'}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Valider
          </button>
        </div>

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
              <span className="font-medium">Mauvaise réponse.</span>
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