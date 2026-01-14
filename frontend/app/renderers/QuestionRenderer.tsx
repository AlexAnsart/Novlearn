import React, { useState, useCallback } from 'react';
import { QuestionContent, RendererProps } from '../types/exercise';
import MathText from '../components/ui/MathText';

interface QuestionRendererProps extends RendererProps<QuestionContent> {
  /** Callback lors de la soumission */
  onSubmit?: (answer: string, isCorrect: boolean) => void;
  /** Réponse correcte calculée */
  correctAnswer?: number | string;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  content,
  variables,
  onSubmit,
  correctAnswer,
}) => {
  console.log("[QuestionRenderer] Rendering:", {
    content,
    variables,
    correctAnswer,
    hasQuestion: !!content?.question,
    answerType: content?.answerType,
  });
  
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset state when variables change (new values generated)
  React.useEffect(() => {
    setAnswer('');
    setFeedback(null);
    setIsSubmitted(false);
  }, [variables]);

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez entrer une réponse.',
      });
      return;
    }

    if (content.answerType === 'numeric') {
      const userAnswer = parseFloat(answer.replace(',', '.'));
      if (isNaN(userAnswer)) {
        setFeedback({
          type: 'warning',
          message: 'Veuillez entrer une valeur numérique valide.',
        });
        return;
      }

      if (correctAnswer !== undefined) {
        const correct =
          typeof correctAnswer === 'number'
            ? correctAnswer
            : parseFloat(String(correctAnswer));
        const isCorrect = Math.abs(userAnswer - correct) <= content.tolerance;

        setFeedback({
          type: isCorrect ? 'success' : 'error',
          message: isCorrect
            ? '✓ Bravo ! Bonne réponse !'
            : `✗ Incorrect. La réponse était ${correct}.`,
        });
        setIsSubmitted(true);
        onSubmit?.(answer, isCorrect);
      } else {
        setFeedback({
          type: 'info',
          message: `Réponse enregistrée : ${userAnswer}`,
        });
        onSubmit?.(answer, true);
      }
    } else {
      setFeedback({
        type: 'info',
        message: 'Réponse enregistrée.',
      });
      onSubmit?.(answer, true);
    }
  }, [answer, content, correctAnswer, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitted) {
      handleSubmit();
    }
  };

  const getFeedbackStyles = () => {
    switch (feedback?.type) {
      case 'success':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return '';
    }
  };

  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      {/* Question */}
      <div className="mb-4">
        <MathText
          content={content.question}
          variables={variables}
          className="text-gray-700 text-lg"
          autoLatex={true}
          requireBraces={true}
        />
      </div>

      {/* Input */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="text"
          inputMode={content.answerType === 'numeric' ? 'decimal' : 'text'}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitted}
          className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-2 border-gray-200 
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
          placeholder="Votre réponse..."
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          className="px-6 py-3 rounded-xl font-semibold text-white
                     bg-gradient-to-b from-blue-500 to-blue-700
                     shadow-[0_4px_0_#1d4ed8,0_6px_12px_rgba(37,99,235,0.3)]
                     hover:translate-y-[-2px] hover:shadow-[0_6px_0_#1d4ed8,0_8px_16px_rgba(37,99,235,0.4)]
                     active:translate-y-[2px] active:shadow-[0_2px_0_#1d4ed8,0_4px_8px_rgba(37,99,235,0.3)]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     transition-all duration-200"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          Vérifier
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div 
          className={`mt-4 p-4 rounded-xl ${getFeedbackStyles()}`}
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;