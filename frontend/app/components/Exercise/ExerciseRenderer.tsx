import React, { useMemo } from "react";
import { useVariables } from "../../hooks/useVariable";
import {
  EquationRenderer,
  FunctionRenderer,
  GraphRenderer,
  MCQRenderer,
  QuestionRenderer,
  SignTableRenderer,
  TextRenderer,
  VariationTableRenderer,
} from "../../renderers";
import {
  EquationContent,
  Exercise,
  ExerciseElement,
  FunctionContent,
  GraphContent,
  MCQContent,
  QuestionContent,
  SignTableContent,
  TextContent,
  VariableValues,
  VariationTableContent,
} from "../../types/exercise";
import { substituteVariables } from "../../utils/math/parsing";

interface ExerciseRendererProps {
  /** L'exercice à afficher */
  exercise: Exercise;
  /** Callback quand un élément interactif est soumis */
  onElementSubmit?: (
    elementId: number,
    answer: unknown,
    isCorrect: boolean
  ) => void;
  /** Variables pré-générées (optionnel) */
  preGeneratedVariables?: VariableValues;
}

interface ElementRendererProps {
  element: ExerciseElement;
  variables: VariableValues;
  onSubmit?: (answer: unknown, isCorrect: boolean) => void;
}

/**
 * Calculate the correct answer for a question element
 * Replaces variables in the answer formula and evaluates the expression
 */
function calculateCorrectAnswer(
  questionContent: QuestionContent,
  variables: VariableValues
): number | string | undefined {
  if (questionContent.answerType === 'numeric' && questionContent.answer) {
    try {
      // Replace variables in braces format {variable} with their values
      let answerExpr = substituteVariables(questionContent.answer, variables);
      
      // Replace ^ with ** for JavaScript exponentiation
      answerExpr = answerExpr.replace(/\^/g, '**');
      
      // Use Function constructor instead of eval for better security
      // This safely evaluates mathematical expressions
      const fn = new Function(`return ${answerExpr}`);
      const result = fn();
      
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
    } catch (e) {
      console.error('Error calculating correct answer:', e, {
        answer: questionContent.answer,
        variables,
      });
    }
  }
  return undefined;
}

/**
 * Composant qui rend un élément d'exercice selon son type
 */
const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  variables,
  onSubmit,
}) => {
  // Normalize element type (handle case variations)
  const normalizedType = element.type?.toLowerCase()?.trim();
  
  console.log("[ElementRenderer] Processing element:", {
    id: element.id,
    originalType: element.type,
    normalizedType,
    hasContent: !!element.content,
  });
  
  switch (normalizedType) {
    case "text":
      return (
        <TextRenderer
          content={element.content as TextContent}
          variables={variables}
        />
      );

    case "function":
      return (
        <FunctionRenderer
          content={element.content as FunctionContent}
          variables={variables}
        />
      );

    case "equation":
      const equationContent = element.content as EquationContent;
      return (
        <EquationRenderer
          content={equationContent}
          variables={variables}
          onSubmit={(answer, isCorrect) => onSubmit?.(answer, isCorrect)}
        />
      );

    case "variation_table":
      return (
        <VariationTableRenderer
          content={element.content as VariationTableContent}
          variables={variables}
        />
      );

    case "sign_table":
      return (
        <SignTableRenderer
          content={element.content as SignTableContent}
          variables={variables}
        />
      );

    case "graph":
      return (
        <GraphRenderer
          content={element.content as GraphContent}
          variables={variables}
        />
      );

    case "question":
      const questionContent = element.content as QuestionContent;
      const correctAnswer = calculateCorrectAnswer(questionContent, variables);
      
      console.log("[ElementRenderer] Rendering question element:", {
        elementId: element.id,
        elementType: element.type,
        questionContent,
        correctAnswer,
        variables,
      });
      
      return (
        <QuestionRenderer
          content={questionContent}
          variables={variables}
          correctAnswer={correctAnswer}
          onSubmit={(answer, isCorrect) => onSubmit?.(answer, isCorrect)}
        />
      );

    case "mcq":
      return (
        <MCQRenderer
          content={element.content as MCQContent}
          variables={variables}
          onSubmit={(index, isCorrect) => onSubmit?.(index, isCorrect)}
        />
      );

    default:
      console.warn("[ElementRenderer] Unsupported element type:", {
        id: element.id,
        type: element.type,
        normalizedType,
        content: element.content,
      });
      
      // If it looks like it might be a question but type is wrong, try to render as question
      if (element.content && typeof element.content === 'object' && 'question' in element.content) {
        console.log("[ElementRenderer] Attempting to render as question despite type mismatch");
        const questionContent = element.content as QuestionContent;
        const correctAnswer = calculateCorrectAnswer(questionContent, variables);
        
        return (
          <QuestionRenderer
            content={questionContent}
            variables={variables}
            correctAnswer={correctAnswer}
            onSubmit={(answer, isCorrect) => onSubmit?.(answer, isCorrect)}
          />
        );
      }
      
      return (
        <div
          className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100 text-gray-500"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          <p>Type d'élément non supporté : {element.type}</p>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(element.content, null, 2)}
          </pre>
        </div>
      );
  }
};

/**
 * Composant principal pour afficher un exercice complet
 */
export const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({
  exercise,
  onElementSubmit,
  preGeneratedVariables,
}) => {
  // Only generate variables if preGeneratedVariables is not provided
  const { values: generatedValues } = useVariables(
    preGeneratedVariables ? [] : exercise.variables
  );

  const variables = useMemo(
    () => preGeneratedVariables || generatedValues,
    [preGeneratedVariables, generatedValues]
  );

  console.log("[ExerciseRenderer] Rendering exercise:", {
    title: exercise.title,
    elementsCount: exercise.elements.length,
    variables,
    elements: exercise.elements,
  });

  console.log("[ExerciseRenderer] Elements to render:", {
    elementsCount: exercise.elements.length,
    elements: exercise.elements.map(el => ({
      id: el.id,
      type: el.type,
      hasContent: !!el.content,
    })),
  });

  return (
    <div className="space-y-5">
      {/* Elements */}
      {exercise.elements.length === 0 ? (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            ⚠️ Cet exercice n'a aucun élément à afficher.
          </p>
        </div>
      ) : (
        exercise.elements.map((element) => {
          console.log("[ExerciseRenderer] Rendering element:", {
            id: element.id,
            type: element.type,
            content: element.content,
          });
          return (
            <ElementRenderer
              key={element.id}
              element={element}
              variables={variables}
              onSubmit={(answer, isCorrect) =>
                onElementSubmit?.(element.id, answer, isCorrect)
              }
            />
          );
        })
      )}
    </div>
  );
};

export default ExerciseRenderer;
