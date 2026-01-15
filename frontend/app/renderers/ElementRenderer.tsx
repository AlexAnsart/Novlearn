'use client';

import React from 'react';
import { VariableValues, ExerciseElement } from '../types/exercise';
import TextRenderer from './TextRenderer';
import QuestionRenderer from './QuestionRenderer';
// Importez les autres renderers ici...

interface ElementRendererProps {
  element: ExerciseElement;
  variables: VariableValues;
  onElementSubmit?: (elementId: number, answer: any, isCorrect: boolean) => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  variables, 
  onElementSubmit 
}) => {
  // TypeScript sait maintenant que si type='text', content est TextContent
  switch (element.type) {
    case 'text':
      return <TextRenderer content={element.content} variables={variables} />;
      
    case 'question':
      return (
        <QuestionRenderer 
          elementId={element.id}
          content={element.content} 
          variables={variables} 
          onElementSubmit={onElementSubmit}
        />
      );

    // Ajoutez les autres cas ici...
    
    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded text-gray-400 text-sm">
          Élément de type "{element.type}" non supporté
        </div>
      );
  }
};

export default ElementRenderer;