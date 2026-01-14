import React from 'react';
import { FunctionContent, RendererProps } from '../types/exercise';
import MathText from '../components/ui/MathText';

const FunctionRenderer: React.FC<RendererProps<FunctionContent>> = ({
  content,
  variables,
}) => {
  const funcName = content.name || 'f';
  const funcVar = content.variable || 'x';
  const functionText = `$${funcName}(${funcVar}) = ${content.expression}$`;

  return (
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📈</span>
        <MathText
          content={functionText}
          variables={variables}
          className="text-blue-900 font-medium text-lg"
          autoLatex={true}
        />
      </div>
      
      {content.domain && (
        <div className="mt-3 ml-10 text-sm text-blue-700">
          <MathText
            content={`Domaine : $D_{${funcName}} = ${content.domain}$`}
            variables={variables}
            autoLatex={true}
          />
        </div>
      )}
    </div>
  );
};

export default FunctionRenderer;