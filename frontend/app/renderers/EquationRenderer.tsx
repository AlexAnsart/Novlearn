import React, { useState, useCallback } from 'react';
import { EquationContent, RendererProps, VariableValues } from '../types/exercise';
import MathText from '../components/ui/MathText';
import { substituteVariables } from '../utils/math/parsing';

interface EquationRendererProps extends RendererProps<EquationContent> {
  /** Callback lors de la soumission */
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

  // Reset state when variables change (new values generated)
  React.useEffect(() => {
    setAnswer('');
    setFeedback(null);
    setIsSubmitted(false);
  }, [variables]);

  // Calculate correct answer if needed
  const calculateCorrectAnswer = useCallback((): string | undefined => {
    if (!content.correctAnswer) return undefined;
    
    try {
      console.log('[EquationRenderer] calculateCorrectAnswer START:', {
        originalCorrectAnswer: content.correctAnswer,
        variables: variables,
        variableKeys: Object.keys(variables),
        variableEntries: Object.entries(variables),
      });
      
      // First, unescape LaTeX format: \\{ becomes {, \\} becomes }
      // Handle different escape formats: \\{z,y}\\ or \{z,y\} or {z,y}
      let correctAnswerStr = content.correctAnswer;
      
      console.log('[EquationRenderer] Step 1 - Original:', {
        original: content.correctAnswer,
        type: typeof content.correctAnswer,
        length: content.correctAnswer.length,
      });
      
      // Remove all backslashes first (handles \\{z,y}\\ -> {z,y})
      correctAnswerStr = correctAnswerStr.replace(/\\/g, '');
      
      console.log('[EquationRenderer] Step 2 - After removing backslashes:', {
        result: correctAnswerStr,
        containsBraces: correctAnswerStr.includes('{'),
        containsZ: correctAnswerStr.includes('z'),
        containsY: correctAnswerStr.includes('y'),
      });
      
      // Replace {variable} format with actual numeric values
      // Handle both {z} and {z,y} formats by replacing each variable individually
      for (const [name, value] of Object.entries(variables)) {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        console.log(`[EquationRenderer] Step 3 - Processing variable ${name}:`, {
          rawValue: value,
          numValue: numValue,
          isNaN: isNaN(numValue),
          isFinite: isFinite(numValue),
          variableExistsInString: correctAnswerStr.includes(name),
        });
        
        if (!isNaN(numValue) && isFinite(numValue)) {
          // Format the number with appropriate decimals
          const formattedValue = Number.isInteger(numValue) 
            ? numValue.toString() 
            : numValue.toFixed(2).replace(/\.?0+$/, '');
          
          console.log(`[EquationRenderer] Step 4 - Replacing variable ${name}:`, {
            formattedValue: formattedValue,
            stringBefore: correctAnswerStr,
          });
          
          // Replace variable name inside braces: {z} or {z,} or {,z} or {z,y}
          // Match the variable name even if it's part of a comma-separated list
          const beforeReplace = correctAnswerStr;
          
          // Strategy 1: Replace {variableName} (standalone)
          correctAnswerStr = correctAnswerStr.replace(new RegExp(`\\{${name}\\}`, 'g'), formattedValue);
          
          // Strategy 2: Replace {variableName, (at start of list)
          correctAnswerStr = correctAnswerStr.replace(new RegExp(`\\{${name}\\s*,`, 'g'), `{${formattedValue},`);
          
          // Strategy 3: Replace ,variableName} (at end of list)
          correctAnswerStr = correctAnswerStr.replace(new RegExp(`,\\s*${name}\\}`, 'g'), `,${formattedValue}}`);
          
          // Strategy 4: Replace ,variableName, (in middle of list)
          correctAnswerStr = correctAnswerStr.replace(new RegExp(`,\\s*${name}\\s*,`, 'g'), `,${formattedValue},`);
          
          console.log(`[EquationRenderer] Step 5 - After replacing ${name}:`, {
            before: beforeReplace,
            after: correctAnswerStr,
            changed: beforeReplace !== correctAnswerStr,
          });
        }
      }
      
      console.log('[EquationRenderer] Step 6 - Final result:', {
        final: correctAnswerStr,
        stillContainsVariables: /[a-zA-Z]/.test(correctAnswerStr),
      });
      
      console.log('[EquationRenderer] Calculated correct answer FINAL:', {
        original: content.correctAnswer,
        calculated: correctAnswerStr,
        variables,
      });
      
      return correctAnswerStr;
    } catch (e) {
      console.error('Error calculating correct answer:', e);
      return content.correctAnswer;
    }
  }, [content.correctAnswer, variables]);

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez entrer une réponse.',
      });
      return;
    }

    if (content.requireAnswer && content.correctAnswer) {
      const correctAnswer = calculateCorrectAnswer();
      const userAnswer = answer.trim();
      
      if (!correctAnswer) {
        setFeedback({
          type: 'warning',
          message: 'Impossible de calculer la réponse correcte.',
        });
        return;
      }
      
      // Normalize both answers for comparison
      const normalizeAnswer = (ans: string): string[] => {
        // Remove all whitespace and braces
        let normalized = ans.replace(/\s+/g, '').toLowerCase();
        // Remove outer braces if present
        normalized = normalized.replace(/^\{|\}$/g, '');
        // Split by comma and clean up
        return normalized.split(',').map(s => s.trim()).filter(s => s).sort();
      };
      
      const userSet = normalizeAnswer(userAnswer);
      const correctSet = normalizeAnswer(correctAnswer);
      
      // Compare sets (order-independent)
      const isCorrect = 
        userSet.length === correctSet.length &&
        userSet.every((val, idx) => {
          // Try numeric comparison first
          const userNum = parseFloat(val);
          const correctNum = parseFloat(correctSet[idx]);
          if (!isNaN(userNum) && !isNaN(correctNum)) {
            // Use tolerance if available, otherwise exact match
            const tolerance = content.tolerance || 0.01;
            return Math.abs(userNum - correctNum) <= tolerance;
          }
          // Fallback to string comparison
          return val === correctSet[idx];
        });

      // Format the correct answer for display (show as set if it's a set)
      const formatCorrectAnswer = (ans: string): string => {
        const normalized = normalizeAnswer(ans);
        if (normalized.length > 1) {
          return `{${normalized.join(', ')}}`;
        }
        return normalized[0] || ans;
      };

      const displayCorrectAnswer = formatCorrectAnswer(correctAnswer);

      setFeedback({
        type: isCorrect ? 'success' : 'error',
        message: isCorrect
          ? '✓ Bravo ! Bonne réponse !'
          : `✗ Incorrect. La réponse correcte était ${displayCorrectAnswer}.`,
      });
      setIsSubmitted(true);
      onSubmit?.(answer, isCorrect);
    } else {
      setFeedback({
        type: 'info',
        message: 'Réponse enregistrée.',
      });
      onSubmit?.(answer, true);
    }
  }, [answer, content, calculateCorrectAnswer, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitted && content.requireAnswer) {
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
      <div className="bg-blue-50 rounded-xl p-6 flex justify-center mb-4">
        <MathText
          content={content.latex}
          variables={variables}
          displayMode={true}
          className="text-xl text-gray-800"
        />
      </div>

      {/* Input for answer if required */}
      {content.requireAnswer && (
        <>
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
              placeholder={content.answerType === 'set' ? 'Ex: {x1, x2}' : 'Votre réponse...'}
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
        </>
      )}
    </div>
  );
};

export default EquationRenderer;