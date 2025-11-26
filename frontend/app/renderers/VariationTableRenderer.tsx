import React from 'react';
import { VariationTableContent, RendererProps } from '../types/exercise';
import { Latex } from '../components/ui/MathText';
import { substituteVariables, toLatex } from '../utils/MathParser';

const VariationTableRenderer: React.FC<RendererProps<VariationTableContent>> = ({
  content,
  variables,
}) => {
  const { points } = content;

  // Composant flèche
  const Arrow: React.FC<{ direction: 'up' | 'down' }> = ({ direction }) => (
    <svg 
      width="40" 
      height="24" 
      viewBox="0 0 40 24" 
      className={direction === 'up' ? 'text-green-500' : 'text-red-500'}
    >
      <defs>
        <marker 
          id={`arrow-${direction}`} 
          markerWidth="10" 
          markerHeight="7" 
          refX="9" 
          refY="3.5" 
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>
      <path
        d={direction === 'up' ? 'M4 20 L36 4' : 'M4 4 L36 20'}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#arrow-${direction})`}
      />
    </svg>
  );

  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontFamily: "'Fredoka', sans-serif" }}>
          <thead>
            <tr>
              <th className="border-2 border-gray-200 bg-blue-50 px-4 py-3 text-gray-700 font-semibold min-w-[60px]">
                x
              </th>
              {points.map((point, index) => {
                const xValue = substituteVariables(point.x, variables);
                const latexX = toLatex(xValue);
                return (
                  <th 
                    key={index} 
                    className="border-2 border-gray-200 bg-blue-50 px-4 py-3 min-w-[80px]"
                  >
                    <Latex variables={variables}>{latexX}</Latex>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border-2 border-gray-200 bg-purple-50 px-4 py-3 text-gray-700 font-semibold">
                f(x)
              </th>
              {points.map((point, index) => {
                const isLast = index === points.length - 1;
                const value = point.value ? substituteVariables(point.value, variables) : '';
                const latexValue = value ? toLatex(value) : '';

                return (
                  <td 
                    key={index} 
                    className="border-2 border-gray-200 px-4 py-2 h-24 align-middle"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      {/* Valeur en haut si croissante */}
                      {value && point.variation === 'croissante' && (
                        <div className="text-gray-700 font-semibold">
                          <Latex>{latexValue}</Latex>
                        </div>
                      )}
                      
                      {/* Valeur centrée si pas de variation */}
                      {value && !point.variation && (
                        <div className="text-gray-700 font-semibold">
                          <Latex>{latexValue}</Latex>
                        </div>
                      )}

                      {/* Flèche */}
                      {!isLast && point.variation === 'croissante' && (
                        <Arrow direction="up" />
                      )}
                      {!isLast && point.variation === 'décroissante' && (
                        <Arrow direction="down" />
                      )}

                      {/* Valeur en bas si décroissante */}
                      {value && point.variation === 'décroissante' && (
                        <div className="text-gray-700 font-semibold">
                          <Latex>{latexValue}</Latex>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VariationTableRenderer;