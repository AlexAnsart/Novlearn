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
 * Composant qui rend un élément d'exercice selon son type
 */
const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  variables,
  onSubmit,
}) => {
  switch (element.type) {
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
      return (
        <EquationRenderer
          content={element.content as EquationContent}
          variables={variables}
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
      return (
        <QuestionRenderer
          content={element.content as QuestionContent}
          variables={variables}
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
      return (
        <div
          className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100 text-gray-500"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          Type d'élément non supporté : {element.type}
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
  const { values: generatedValues } = useVariables(exercise.variables);

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

  return (
    <div className="space-y-5">
      {/* Elements */}
      {exercise.elements.map((element) => {
        console.log("[ExerciseRenderer] Rendering element:", element);
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
      })}
    </div>
  );
};

export default ExerciseRenderer;
