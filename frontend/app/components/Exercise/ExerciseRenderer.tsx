import React, { useMemo } from "react";
// Assurez-vous que le chemin d'import pointe bien vers votre dossier renderers
import EquationRenderer from "../../renderers/EquationRenderer";
import FunctionRenderer from "../../renderers/FunctionRenderer";
import GraphRenderer from "../../renderers/GraphRenderer";
import MCQRenderer from "../../renderers/MCQRenderer";
import QuestionRenderer from "../../renderers/QuestionRenderer";
import SignTableRenderer from "../../renderers/SignTableRenderer";
import TextRenderer from "../../renderers/TextRenderer";
import VariationTableRenderer from "../../renderers/VariationTableRenderer";

import {
  Exercise,
  ExerciseElement,
  VariableValues,
  // Types spécifiques
  TextContent,
  FunctionContent,
  EquationContent,
  VariationTableContent,
  SignTableContent,
  GraphContent,
  QuestionContent,
  MCQContent
} from "../../types/exercise";

interface ExerciseRendererProps {
  exercise: Exercise;
  onElementSubmit?: (
    elementId: number,
    answer: unknown,
    isCorrect: boolean
  ) => void;
  preGeneratedVariables?: VariableValues;
}

interface ElementRendererProps {
  element: ExerciseElement;
  variables: VariableValues;
  // Callback unifié : la réponse + est-ce correct
  onChildSubmit?: (answer: unknown, isCorrect: boolean) => void;
}

/**
 * Composant dispatcher : choisit le bon renderer selon le type
 */
const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  variables,
  onChildSubmit,
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
          onSubmit={onChildSubmit} // EquationRenderer attend onSubmit
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
          onSubmit={onChildSubmit} // QuestionRenderer attend maintenant onSubmit
        />
      );

    case "mcq":
      return (
        <MCQRenderer
          content={element.content as MCQContent}
          variables={variables}
          onSubmit={onChildSubmit} // MCQRenderer attend onSubmit
        />
      );

    default:
      return (
        <div className="p-4 border border-dashed border-red-200 bg-red-50 text-red-600 rounded">
           Type non supporté : {(element as any).type}
        </div>
      );
  }
};

/**
 * Composant principal
 */
export const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({
  exercise,
  onElementSubmit,
  preGeneratedVariables,
}) => {
  // Si les variables ne sont pas fournies, on pourrait les générer ici,
  // mais idéalement elles viennent du ExerciseLoader via preGeneratedVariables.
  const variables = useMemo(
    () => preGeneratedVariables || {}, 
    [preGeneratedVariables]
  );

  return (
    <div className="space-y-6">
      {exercise.elements.map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          variables={variables}
          // On injecte l'ID de l'élément ici, comme ça l'enfant n'a pas besoin de le savoir
          onChildSubmit={(answer, isCorrect) =>
            onElementSubmit?.(element.id, answer, isCorrect)
          }
        />
      ))}
    </div>
  );
};

export default ExerciseRenderer;