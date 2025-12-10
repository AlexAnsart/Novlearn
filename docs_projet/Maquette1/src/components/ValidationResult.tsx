import { useEffect, useState } from "react";

interface ValidationResultProps {
  status: "correct" | "partial" | "incorrect";
  onNewExercise: () => void;
}

export function ValidationResult({ status, onNewExercise }: ValidationResultProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée avec un léger délai
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const config = {
    correct: {
      bg: "from-green-600 to-green-500",
      text: "Tu as tout juste !",
    },
    partial: {
      bg: "from-yellow-600 to-yellow-500",
      text: "Tu as partiellement juste",
    },
    incorrect: {
      bg: "from-red-600 to-red-500",
      text: "Tu t'es trompé(e)",
    },
  };

  const { bg, text } = config[status];

  return (
    <div
      className={`fixed left-24 right-0 bottom-0 bg-gradient-to-r ${bg} flex items-center justify-between px-12 py-8 transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      style={{
        height: "auto",
        animation: isVisible ? "wave 1.5s ease-in-out" : "none",
      }}
    >
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0) scaleY(1); }
          25% { transform: translateY(-10px) scaleY(1.05); }
          50% { transform: translateY(5px) scaleY(0.95); }
          75% { transform: translateY(-5px) scaleY(1.02); }
        }
      `}</style>

      <p
        className="text-white"
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: "2rem",
        }}
      >
        {text}
      </p>

      <button
        onClick={onNewExercise}
        className="bg-white text-black rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: "1.125rem",
        }}
      >
        Nouvel exercice
      </button>
    </div>
  );
}
