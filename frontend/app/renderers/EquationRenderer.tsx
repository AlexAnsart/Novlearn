import React from 'react';
import { EquationContent, RendererProps } from '../types/exercise';
import MathText from '../components/ui/MathText';

const EquationRenderer: React.FC<RendererProps<EquationContent>> = ({
  content,
  variables,
}) => {
  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      <div className="bg-blue-50 rounded-xl p-6 flex justify-center">
        <MathText
          content={content.latex}
          variables={variables}
          displayMode={true}
          className="text-xl text-gray-800"
        />
      </div>
    </div>
  );
};

export default EquationRenderer;