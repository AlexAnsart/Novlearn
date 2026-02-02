'use client';

import React, { useState, useCallback } from 'react';
import { MCQContent, RendererProps } from '../types/exercise';
import { MathText } from '../components/ui';

interface MCQRendererProps extends RendererProps<MCQContent> {
  onSubmit?: (selectedIndex: number, isCorrect: boolean) => void;
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

  const handleValidate = () => {
    if (selectedIndex === null) return;
    const isCorrect = content.options[selectedIndex].correct;
    setIsValidated(true);
    onSubmit?.(selectedIndex, isCorrect);
  };

  const getOptionStyle = (index: number, isCorrectOption: boolean) => {
    const base = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ";
    
    if (!isValidated) {
      return selectedIndex === index 
        ? base + "border-blue-500 bg-blue-50" 
        : base + "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
    }

    if (isCorrectOption) return base + "border-green-500 bg-green-50";
    if (selectedIndex === index) return base + "border-red-500 bg-red-50";
    return base + "border-gray-200 opacity-50";
  };

  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <MathText 
          content={content.question} 
          variables={variables} 
          className="text-lg font-medium text-slate-800"
        />
      </div>

      <div className="space-y-3 mb-6">
        {content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isValidated && setSelectedIndex(index)}
            className={getOptionStyle(index, option.correct)}
            disabled={isValidated}
          >
            <span className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${!isValidated && selectedIndex === index ? 'bg-blue-500 text-white' : 
                isValidated && option.correct ? 'bg-green-500 text-white' :
                isValidated && selectedIndex === index ? 'bg-red-500 text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {String.fromCharCode(65 + index)}
            </span>
            <div className="flex-grow">
              <MathText content={option.text} variables={variables} />
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleValidate}
          disabled={isValidated || selectedIndex === null}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Valider
        </button>
        {isValidated && allowRetry && (
          <button
            onClick={() => { setIsValidated(false); setSelectedIndex(null); }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
};

export default MCQRenderer;