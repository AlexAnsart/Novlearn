import React from 'react';
import { SignTableContent, RendererProps } from '../types/exercise';
import { Latex } from '../components/ui/MathText';
import { substituteVariables, toLatex } from '../utils/MathParser';

const SignTableRenderer: React.FC<RendererProps<SignTableContent>> = ({
  content,
  variables,
}) => {
  const { points } = content;

  const getSignStyle = (sign: string) => {
    switch (sign) {
      case '+':
        return { className: 'text-green-500 font-bold text-2xl', display: '+' };
      case '-':
        return { className: 'text-red-500 font-bold text-2xl', display: '−' };
      case '0':
        return { className: 'text-amber-500 font-bold text-xl', display: '0' };
      default:
        return { className: 'text-gray-500', display: sign };
    }
  };

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
              <th className="border-2 border-gray-200 bg-amber-50 px-4 py-3 text-gray-700 font-semibold">
                Signe
              </th>
              {points.map((point, index) => {
                const signStyle = getSignStyle(point.sign);
                return (
                  <td 
                    key={index} 
                    className="border-2 border-gray-200 px-4 py-4 text-center"
                  >
                    <span className={signStyle.className}>
                      {signStyle.display}
                    </span>
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

export default SignTableRenderer;