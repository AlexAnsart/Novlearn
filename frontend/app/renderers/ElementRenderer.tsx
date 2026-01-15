'use client';

import React from 'react';
import { VariableValues, ExerciseElement, QuestionContent, EquationContent, MCQContent } from '../types/exercise';
import TextRenderer from './TextRenderer';
import QuestionRenderer from './QuestionRenderer';
import EquationRenderer from './EquationRenderer';
import FunctionRenderer from './FunctionRenderer';
import GraphRenderer from './GraphRenderer';
import MCQRenderer from './MCQRenderer';
import SignTableRenderer from './SignTableRenderer';
import VariationTableRenderer from './VariationTableRenderer';

interface ElementRendererProps {
  element: ExerciseElement;
  variables: VariableValues;
  /** Callback global qui nécessite l'ID */
  onElementSubmit?: (elementId: number, answer: any, isCorrect: boolean) => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  variables, 
  onElementSubmit 
}) => {
  switch (element.type) {
    case 'text':
      return <TextRenderer content={element.content} variables={variables} />;
      
    case 'question':
      return (
        <QuestionRenderer 
          content={element.content as QuestionContent} 
          variables={variables} 
          // ADAPTATEUR : On reçoit (answer, correct) et on renvoie (id, answer, correct)
          onSubmit={(answer, isCorrect) => onElementSubmit?.(element.id, answer, isCorrect)}
        />
      );

    case 'equation':
       return (
        <EquationRenderer 
          content={element.content as EquationContent} 
          variables={variables}
          onSubmit={(answer, isCorrect) => onElementSubmit?.(element.id, answer, isCorrect)}
        />
      );
      
    case 'mcq':
       return (
        <MCQRenderer 
          content={element.content as MCQContent} 
          variables={variables}
          onSubmit={(index, isCorrect) => onElementSubmit?.(element.id, index, isCorrect)}
        />
      );

    case 'function':
      return <FunctionRenderer content={element.content} variables={variables} />;

    case 'graph':
      return <GraphRenderer content={element.content} variables={variables} />;

    case 'variation_table':
      return <VariationTableRenderer content={element.content} variables={variables} />;

    case 'sign_table':
      return <SignTableRenderer content={element.content} variables={variables} />;

    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded text-gray-400 text-sm">
          Élément de type "{(element as any).type}" non supporté
        </div>
      );
  }
};

export default ElementRenderer;