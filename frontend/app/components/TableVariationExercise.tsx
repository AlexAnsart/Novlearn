'use client';

import { useState } from "react";

interface TableVariationExerciseProps {
  onValidate: (answers: string[], isCorrect: boolean, isPartial: boolean) => void;
  onSkip: () => void;
}

export function TableVariationExercise({ onValidate, onSkip }: TableVariationExerciseProps) {
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", "", ""]);

  const correctAnswers = ["1", "2", "3", "4", "5", "6"];

  const handleValidate = () => {
    const correctCount = answers.filter((ans, idx) => ans === correctAnswers[idx]).length;
    const isCorrect = correctCount === correctAnswers.length;
    const isPartial = correctCount > 0 && correctCount < correctAnswers.length;
    onValidate(answers, isCorrect, isPartial);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  return (
    <div className="bg-white backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="space-y-6">
        {/* Énoncé */}
        <div>
          <h3
            className="text-gray-800 mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
          >
            Tableau de variations
          </h3>
          <p
            className="text-gray-700"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.125rem" }}
          >
            Soit f une fonction définie sur ℝ par :
          </p>
          <p
            className="text-gray-900 mt-2"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.25rem" }}
          >
            f(x) = x³ - 3x² + 2
          </p>
          <p
            className="text-gray-700 mt-4"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.125rem" }}
          >
            Complétez le tableau de variations ci-dessous :
          </p>
        </div>

        {/* Tableau de variations */}
        <div className="bg-blue-50 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                {[0, 1, 2].map((colIndex) => (
                  <td
                    key={colIndex}
                    className="border-2 border-blue-300 p-4 text-center bg-white"
                    style={{ minWidth: "150px" }}
                  >
                    <input
                      type="text"
                      value={answers[colIndex]}
                      onChange={(e) => handleAnswerChange(colIndex, e.target.value)}
                      className="w-full bg-gray-50 text-gray-900 rounded-lg px-3 py-2 text-center outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}
                      placeholder="..."
                    />
                  </td>
                ))}
              </tr>
              <tr>
                {[3, 4, 5].map((colIndex) => (
                  <td
                    key={colIndex}
                    className="border-2 border-blue-300 p-4 text-center bg-white"
                  >
                    <input
                      type="text"
                      value={answers[colIndex]}
                      onChange={(e) => handleAnswerChange(colIndex, e.target.value)}
                      className="w-full bg-gray-50 text-gray-900 rounded-lg px-3 py-2 text-center outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}
                      placeholder="..."
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Boutons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleValidate}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
          >
            Valider
          </button>
          <button
            onClick={onSkip}
            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}

