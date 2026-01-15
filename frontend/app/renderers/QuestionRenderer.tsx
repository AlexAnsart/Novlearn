'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';
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
  const [attempts, setAttempts] = useState(0); // Compteur d'essais
  const [isFinished, setIsFinished] = useState(false); // Est-ce fini (réussi ou perdu)
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isFinished) return;

    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    // Vérification
    const isCorrect = checkAnswer(value, content.correctAnswer, variables, content.answerFormat);
    
    if (isCorrect) {
      // CAS : BONNE RÉPONSE
      setStatus('correct');
      setIsFinished(true); // On verrouille
      if (onSubmit) onSubmit(value, true);
    } else {
      // CAS : MAUVAISE RÉPONSE
      setStatus('incorrect');
      
      if (currentAttempt >= 2) {
        // C'est perdu après 2 essais
        setIsFinished(true); // On verrouille
        if (onSubmit) onSubmit(value, false);
      } else {
        // Premier échec : On laisse la main, pas de submit final encore
        // L'utilisateur pourra voir le bouton indice
      }
    }
  };

  return (
    <div className={`my-6 p-6 rounded-xl shadow-sm border transition-colors ${
      isFinished && status === 'correct' ? 'bg-green-50/50 border-green-100' :
      isFinished && status === 'incorrect' ? 'bg-red-50/50 border-red-100' :
      'bg-white border-slate-200'
    }`}>
      
      {/* En-tête Question */}
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
        
        {/* Champ de saisie */}
        <div className="flex gap-3 items-start max-w-md">
          <input
            type="text"
            inputMode={content.answerFormat === 'number' ? "decimal" : "text"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              // Si on réécrit après une erreur (et que ce n'est pas fini), on remet le status idle
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
            {isFinished ? 'Validé' : attempts > 0 ? 'Réessayer' : 'Valider'}
          </button>
        </div>

        {/* FEEDBACKS INTERMÉDIAIRES (Avant la fin) */}
        {!isFinished && status === 'incorrect' && (
          <div className="animate-in fade-in slide-in-from-left-2 space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Ce n'est pas ça. Il vous reste un essai !</span>
            </div>

            {/* Bouton Indice (visible seulement si on a raté une fois) */}
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

        {/* ÉTATS FINAUX (Réussi ou 2 erreurs) */}
        
        {isFinished && status === 'correct' && (
          <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-left-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">Excellent ! Bonne réponse.</span>
          </div>
        )}

        {isFinished && status === 'incorrect' && (
          <div className="flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-left-2">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">Mince, c'est raté pour cette fois.</span>
          </div>
        )}

        {/* CORRECTION FINALE (S'affiche toujours à la fin, que ce soit juste ou faux, s'il y a une explication) */}
        {isFinished && content.explanation && (
          <div className={`mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2
            ${status === 'correct' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-1 rounded-full ${status === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className={`text-xs font-bold uppercase tracking-wider ${status === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                  {status === 'correct' ? 'Explication' : 'Correction'}
                </p>
                <div className="text-slate-800 text-sm leading-relaxed">
                  <MathText content={content.explanation} variables={variables} />
                </div>
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default QuestionRenderer;