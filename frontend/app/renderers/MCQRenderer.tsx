import React, { useState, useCallback } from 'react';
import { MCQContent, RendererProps } from '../types/exercise';
import MathText from '../components/ui/MathText';

interface MCQRendererProps extends RendererProps<MCQContent> {
  /** Callback lors de la validation */
  onSubmit?: (selectedIndex: number, isCorrect: boolean) => void;
  /** Permettre plusieurs tentatives */
  allowRetry?: boolean;
}

const MCQRenderer: React.FC<MCQRendererProps> = ({
  content,
  variables,
  onSubmit,
  allowRetry = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSelect = useCallback((index: number) => {
    if (!isValidated) {
      setSelectedIndex(index);
    }
  }, [isValidated]);

  const handleValidate = useCallback(() => {
    if (selectedIndex === null) {
      setFeedback({
        type: 'error',
        message: 'Veuillez sélectionner une réponse.',
      });
      return;
    }

    const isCorrect = content.options[selectedIndex].correct;
    setIsValidated(true);
    setFeedback({
      type: isCorrect ? 'success' : 'error',
      message: isCorrect
        ? '✓ Bravo ! Bonne réponse !'
        : '✗ Incorrect. La bonne réponse est indiquée en vert.',
    });
    onSubmit?.(selectedIndex, isCorrect);
  }, [selectedIndex, content.options, onSubmit]);

  const handleRetry = useCallback(() => {
    setSelectedIndex(null);
    setIsValidated(false);
    setFeedback(null);
  }, []);

  const getOptionClasses = (index: number): string => {
    const base = `w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3`;

    if (!isValidated) {
      if (selectedIndex === index) {
        return `${base} border-blue-500 bg-blue-50`;
      }
      return `${base} border-gray-200 hover:border-gray-300 hover:translate-x-1 cursor-pointer`;
    }

    // Après validation
    if (content.options[index].correct) {
      return `${base} border-green-500 bg-green-50`;
    }
    if (selectedIndex === index && !content.options[index].correct) {
      return `${base} border-red-500 bg-red-50`;
    }
    return `${base} border-gray-200 opacity-50`;
  };

  const getLetterClasses = (index: number): string => {
    const base = 'inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm';

    if (!isValidated) {
      return selectedIndex === index
        ? `${base} bg-blue-500 text-white`
        : `${base} bg-gray-200 text-gray-600`;
    }

    if (content.options[index].correct) {
      return `${base} bg-green-500 text-white`;
    }
    if (selectedIndex === index) {
      return `${base} bg-red-500 text-white`;
    }
    return `${base} bg-gray-200 text-gray-400`;
  };

  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      {/* Question */}
      <div className="mb-5">
        <MathText
          content={content.question}
          variables={variables}
          className="text-gray-700 text-lg"
          autoLatex={true}
          requireBraces={true}
        />
      </div>

      {/* Options */}
      <div className="space-y-3 mb-5">
        {content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={isValidated}
            className={getOptionClasses(index)}
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            <span className={getLetterClasses(index)}>
              {String.fromCharCode(65 + index)}
            </span>
            <MathText
              content={option.text}
              variables={variables}
              className="text-gray-700"
              autoLatex={true}
              requireBraces={false}
            />
          </button>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleValidate}
          disabled={isValidated && !allowRetry}
          className="px-6 py-3 rounded-xl font-semibold text-white
                     bg-gradient-to-b from-green-500 to-green-700
                     shadow-[0_4px_0_#15803d,0_6px_12px_rgba(34,197,94,0.3)]
                     hover:translate-y-[-2px] hover:shadow-[0_6px_0_#15803d,0_8px_16px_rgba(34,197,94,0.4)]
                     active:translate-y-[2px] active:shadow-[0_2px_0_#15803d,0_4px_8px_rgba(34,197,94,0.3)]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     transition-all duration-200"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          Valider
        </button>
        
        {isValidated && allowRetry && (
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl font-semibold text-white
                       bg-gradient-to-b from-purple-500 to-purple-700
                       shadow-[0_4px_0_#6b21a8,0_6px_12px_rgba(147,51,234,0.3)]
                       hover:translate-y-[-2px] hover:shadow-[0_6px_0_#6b21a8,0_8px_16px_rgba(147,51,234,0.4)]
                       active:translate-y-[2px] active:shadow-[0_2px_0_#6b21a8,0_4px_8px_rgba(147,51,234,0.3)]
                       transition-all duration-200"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Réessayer
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div 
          className={`mt-4 p-4 rounded-xl ${
            feedback.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default MCQRenderer;