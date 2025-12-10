import React from "react";
import MathText from "../components/ui/MathText";
import { RendererProps, TextContent } from "../types/exercise";

const TextRenderer: React.FC<RendererProps<TextContent>> = ({
  content,
  variables,
}) => {
  console.log("[TextRenderer] Rendering:", { content, variables });

  return (
    <div className="p-6 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-lg">
      <MathText
        content={content.text}
        variables={variables}
        className="text-white text-xl leading-relaxed"
        autoLatex={true}
        requireBraces={true}
      />
    </div>
  );
};

export default TextRenderer;
