'use client';

import React from 'react';
import { MathText } from '../components/ui';
import { VariableValues } from '../types/exercise';

interface TextRendererProps {
  content: { text: string };
  variables: VariableValues;
}

const TextRenderer: React.FC<TextRendererProps> = ({ content, variables }) => {
  return (
    <div className="mb-6 text-slate-800 leading-relaxed">
      <MathText 
        content={content.text} 
        variables={variables} 
        className="text-lg"
      />
    </div>
  );
};

export default TextRenderer;