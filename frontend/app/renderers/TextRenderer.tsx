import React from 'react';
import { TextContent, RendererProps } from '../types/exercise';
import MathText from '../components/ui/MathText';

const TextRenderer: React.FC<RendererProps<TextContent>> = ({
  content,
  variables,
}) => {
  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      <MathText
        content={content.text}
        variables={variables}
        className="text-gray-700 text-lg leading-relaxed"
        autoLatex={true}
        requireBraces={true}
      />
    </div>
  );
};

export default TextRenderer;