import { useState } from "react";

interface ExponentialExerciseProps {
  onValidate: (answers: string[], isCorrect: boolean, isPartial: boolean) => void;
  onSkip: () => void;
}

export function ExponentialExercise({ onValidate, onSkip }: ExponentialExerciseProps) {
  const [answer, setAnswer] = useState("");

  const correctAnswer = "0"; // La limite de x²·e^(-x) en +∞ est 0

  const handleValidate = () => {
    const isCorrect = answer.trim() === correctAnswer;
    onValidate([answer], isCorrect, false);
  };

  return (
    <div className="bg-white backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="space-y-6">
        {/* Titre de l'exercice */}
        <div className="border-b-2 border-gray-300 pb-3">
          <h3
            className="text-gray-800"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
          >
            Exercice - Fonction exponentielle
          </h3>
          <p
            className="text-gray-600 mt-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Terminale - Analyse
          </p>
        </div>

        {/* Énoncé */}
        <div className="space-y-3 text-gray-700">
          <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.125rem" }}>
            Soit la fonction <span className="italic">f</span> définie sur ℝ par :
          </p>

          {/* Formule mathématique */}
          <div className="bg-blue-50 rounded-2xl p-6 my-3 flex items-center justify-center">
            <span className="text-3xl text-gray-900" style={{ fontFamily: "serif" }}>
              <i>f</i>(<i>x</i>) = <i>x</i>² · e<sup>-<i>x</i></sup>
            </span>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <p
              className="text-gray-900"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}
            >
              1. Déterminer la limite de <i>f</i> en +∞
            </p>

            {/* Champ de réponse */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <label
                className="text-gray-700 mb-2 block"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                Réponse :
              </label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}
                placeholder="Entrez votre réponse..."
              />
            </div>
          </div>
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