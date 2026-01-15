'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Lightbulb, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { MathText } from '../components/ui';
import { VariableValues, QuestionContent } from '../types/exercise';
import { checkAnswer } from '../utils/math/evaluation';

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
  const [attempts, setAttempts] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  
  // États pour l'affichage progressif
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isFinished) return;

    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    const isCorrect = checkAnswer(value, content.correctAnswer, variables, content.answerFormat);
    
    if (isCorrect) {
      // SUCCÈS
      setStatus('correct');
      setIsFinished(true);
      if (onSubmit) onSubmit(value, true);
    } else {
      // ÉCHEC
      setStatus('incorrect');
      
      if (currentAttempt >= 2) {
        // PERDU (2ème essai raté)
        setIsFinished(true);
        if (onSubmit) onSubmit(value, false);
      }
      // Sinon, on laisse une chance (feedback intermédiaire géré dans le render)
    }
  };

  return (
    <div className={`my-6 p-6 rounded-xl shadow-sm border transition-colors ${
      isFinished && status === 'correct' ? 'bg-green-50/50 border-green-100' :
      isFinished && status === 'incorrect' ? 'bg-red-50/50 border-red-100' :
      'bg-white border-slate-200'
    }`}>
      
      {/* --- EN-TÊTE --- */}
      <div className="flex gap-3 mb-4">
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
          ${isFinished && status === 'correct' ? 'bg-green-100 text-green-700' : 
            isFinished && status === 'incorrect' ? 'bg-red-100 text-red-700' : 
            'bg-indigo-100 text-indigo-600'}`}>
          {isFinished ? (status === 'correct' ? '✓' : '✗') : '?'}
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
        
        {/* --- INPUT & BOUTON --- */}
        <div className="flex gap-3 items-start max-w-md">
          <input
            type="text"
            inputMode={content.answerFormat === 'number' ? "decimal" : "text"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (!isFinished && status === 'incorrect') setStatus('idle');
            }}
            placeholder={isFinished ? (status === 'correct' ? "Réponse validée" : "Terminé") : "Votre réponse..."}
            className={`flex-grow px-4 py-2 rounded-lg border outline-none transition-all
              ${status === 'correct' ? 'border-green-500 bg-white text-green-700 font-medium' : 
                status === 'incorrect' && isFinished ? 'border-red-500 bg-white text-red-700 line-through decoration-red-500' : 
                status === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' : 
                'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-offset-1'}`}
            disabled={isFinished} 
          />
          
          <button
            type="submit"
            disabled={!value || isFinished}
            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors shadow-sm
              ${isFinished 
                ? 'bg-slate-300 cursor-not-allowed opacity-50' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
          >
            {isFinished ? 'Terminé' : attempts > 0 ? 'Réessayer' : 'Valider'}
          </button>
        </div>

        {/* --- FEEDBACK 1er ESSAI RATÉ --- */}
        {!isFinished && status === 'incorrect' && (
          <div className="animate-in fade-in slide-in-from-left-2 space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Ce n'est pas ça. Il vous reste un essai !</span>
            </div>

            {content.hint && (
               !showHint ? (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium hover:underline"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Besoin d'un petit coup de pouce ?
                  </button>
               ) : (
                  <div className="p-3 bg-indigo-50 text-indigo-800 text-sm rounded-lg border border-indigo-100 flex gap-2 animate-in fade-in">
                    <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs uppercase mb-1 opacity-70">Indice :</span>
                      <MathText content={content.hint} variables={variables} />
                    </div>
                  </div>
               )
            )}
          </div>
        )}

        {/* --- ÉTAT FINAL : GAGNÉ --- */}
        {isFinished && status === 'correct' && (
          <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-left-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">Excellent ! Bonne réponse.</span>
          </div>
        )}

        {/* --- ÉTAT FINAL : PERDU (Affichage Correction) --- */}
        {isFinished && status === 'incorrect' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
            
            {/* 1. Message d'échec */}
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="font-bold">Mince, c'est raté.</span>
            </div>

            {/* 2. La Correction (Le Résultat) */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-slate-500">Réponse :</span>
              <span className="font-bold text-lg text-slate-800">
                <MathText content={content.correctAnswer} variables={variables} displayMode={false} />
              </span>
            </div>
          </div>
        )}

        {/* --- BOUTON EXPLICATION (Commun Gagné/Perdu) --- */}
        {isFinished && content.explanation && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors
                ${status === 'correct' ? 'text-green-700 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'}`}
            >
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showExplanation ? "Masquer l'explication" : "Explication de la correction"}
            </button>

            {/* Contenu de l'explication (Accordion) */}
            {showExplanation && (
              <div className={`mt-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2
                ${status === 'correct' ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-1 rounded-full ${status === 'correct' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="text-slate-800 text-sm leading-relaxed">
                    <MathText content={content.explanation} variables={variables} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </form>
    </div>
  );
};

export default QuestionRenderer;