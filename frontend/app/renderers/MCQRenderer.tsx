"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import MathText from "../components/ui/MathText";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import { MCQContent, RendererProps } from "../types/exercise";

interface MCQRendererProps extends RendererProps<MCQContent> {
  onSubmit?: (selectedIndex: number, isCorrect: boolean) => void;
}

// Fonction de mélange Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  if (!array || array.length === 0) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const MCQRenderer: React.FC<MCQRendererProps> = ({
  content,
  variables,
  onSubmit,
}) => {
  const { playSuccess, playError } = useAudioFeedback();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [isFinished, setIsFinished] = useState(false);
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">(
    "idle",
  );
  const [showExplanation, setShowExplanation] = useState(false);

  const isMultipleChoice = content?.multipleChoice ?? false;

  // Mélanger les options une seule fois au montage
  // Les options "Aucune des réponses..." restent toujours en dernier
  const shuffledOptions = useMemo(() => {
    const options = content?.options || [];
    const pinnedPattern =
      /aucune\s+(des|de\s+la|de\s+l'|des\s+autres|des\s+r[eé]ponses)/i;
    const pinned = options.filter((opt) => pinnedPattern.test(opt.text));
    const rest = options.filter((opt) => !pinnedPattern.test(opt.text));
    return [...shuffleArray(rest), ...pinned];
  }, [content?.options]);

  const handleSelect = (index: number) => {
    if (isFinished) return;

    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (isMultipleChoice) {
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
      } else {
        newSet.clear();
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleValidate = () => {
    if (selectedIndices.size === 0 || isFinished) return;

    // Correct = toutes les bonnes réponses sélectionnées ET aucune mauvaise
    const correctIndices = new Set(
      shuffledOptions
        .map((opt, idx) => (opt.correct ? idx : -1))
        .filter((idx) => idx !== -1),
    );

    const allCorrectSelected = [...correctIndices].every((idx) =>
      selectedIndices.has(idx),
    );
    const noIncorrectSelected = [...selectedIndices].every(
      (idx) => shuffledOptions[idx].correct,
    );
    const isCorrect = allCorrectSelected && noIncorrectSelected;

    setStatus(isCorrect ? "correct" : "incorrect");
    setIsFinished(true);
    setShowExplanation(true); // Afficher l'explication automatiquement à la fin
    if (isCorrect) playSuccess();
    else playError();
    onSubmit?.([...selectedIndices][0], isCorrect);
  };

  // Récupérer les bonnes réponses pour l'affichage de la correction
  const correctOptionTexts = useMemo(() => {
    return shuffledOptions.filter((opt) => opt.correct).map((opt) => opt.text);
  }, [shuffledOptions]);

  // Si pas de contenu valide
  if (!content || !shuffledOptions.length) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">Chargement du QCM...</p>
      </div>
    );
  }

  return (
    <div
      className={`my-6 p-6 rounded-xl shadow-sm border transition-all duration-500 ${
        isFinished && status === "correct"
          ? "bg-green-50/30 border-green-200"
          : isFinished && status === "incorrect"
            ? "bg-red-50/30 border-red-200"
            : "bg-white border-slate-200"
      }`}
    >
      {/* --- EN-TÊTE QUESTION --- */}
      <div className="flex gap-3 mb-6">
        <div
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-colors
          ${
            isFinished && status === "correct"
              ? "bg-green-100 text-green-700"
              : isFinished && status === "incorrect"
                ? "bg-red-100 text-red-700"
                : "bg-indigo-100 text-indigo-600"
          }`}
        >
          {isFinished ? (status === "correct" ? "✓" : "✗") : "?"}
        </div>
        <div className="flex-grow pt-1">
          <MathText
            content={content.question}
            variables={variables}
            className="font-medium text-lg text-slate-800"
          />
          {isMultipleChoice && !isFinished && (
            <p className="text-sm text-slate-500 mt-2 italic flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-slate-400"></span>
              Plusieurs réponses possibles
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6 ml-0 md:ml-11">
        {/* --- LISTE DES OPTIONS --- */}
        <div className="space-y-3">
          {shuffledOptions.map((option, index) => {
            const isSelected = selectedIndices.has(index);
            const isCorrect = option.correct;

            // Calcul du style dynamique
            let containerStyle =
              "border-slate-200 hover:border-slate-300 hover:bg-slate-50";
            let indicatorStyle = "bg-slate-100 text-slate-500";

            if (!isFinished) {
              if (isSelected) {
                containerStyle = "border-indigo-500 bg-indigo-50/50";
                indicatorStyle = "bg-indigo-500 text-white";
              }
            } else {
              // État terminé
              if (isCorrect) {
                // C'était une bonne réponse (qu'elle soit sélectionnée ou non, on la montre en vert)
                containerStyle = "border-green-500 bg-green-50/50";
                indicatorStyle = "bg-green-500 text-white";
              } else if (isSelected && !isCorrect) {
                // Mauvaise réponse sélectionnée
                containerStyle = "border-red-500 bg-red-50/50";
                indicatorStyle = "bg-red-500 text-white";
              } else {
                // Option neutre non sélectionnée
                containerStyle = "border-slate-100 opacity-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={isFinished}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${containerStyle}`}
              >
                <span
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors ${
                    isMultipleChoice ? "rounded-md" : "rounded-full"
                  } ${indicatorStyle}`}
                >
                  {isFinished && isCorrect
                    ? "✓"
                    : isFinished && isSelected
                      ? "✗"
                      : String.fromCharCode(65 + index)}
                </span>
                <div className="flex-grow text-slate-800">
                  <MathText
                    content={option.text}
                    variables={variables}
                    className="text-slate-800"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* --- BOUTON VALIDER --- */}
        {!isFinished && (
          <button
            onClick={handleValidate}
            disabled={selectedIndices.size === 0}
            className={`px-6 py-2.5 text-white font-medium rounded-lg transition-all shadow-md active:scale-95 w-full sm:w-auto
                ${
                  selectedIndices.size === 0
                    ? "bg-slate-400 cursor-not-allowed opacity-50 shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
                }`}
          >
            Valider
          </button>
        )}

        {/* --- RÉSULTAT FINAL --- */}
        {isFinished && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div
              className={`flex items-center gap-2 text-lg font-bold
              ${status === "correct" ? "text-green-600" : "text-red-600"}`}
            >
              {status === "correct" ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Excellent ! Bonne réponse.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6" />
                  <span>Mince, c'est raté pour cette fois.</span>
                </>
              )}
            </div>

            {/* --- CORRECTION (Réponses attendues) --- */}
            {status === "incorrect" && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-sm">
                <span className="font-bold text-sm uppercase text-slate-500 tracking-wider">
                  Réponse(s) attendue(s) :
                </span>
                <div className="flex flex-col gap-2">
                  {correctOptionTexts.map((text, i) => (
                    <div
                      key={i}
                      className="font-bold text-lg text-slate-800 flex items-center gap-2"
                    >
                      <span className="text-green-600 text-sm">●</span>
                      <MathText content={text} variables={variables} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- EXPLICATION --- */}
            {content.explanation && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <div className="p-1 rounded-full bg-slate-100 group-hover:bg-indigo-100 transition-colors">
                    {showExplanation ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  {showExplanation
                    ? "Masquer l'explication"
                    : "Voir l'explication de la correction"}
                </button>

                {showExplanation && (
                  <div className="mt-3 p-5 rounded-xl bg-blue-50/50 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                          Détails du raisonnement
                        </p>
                        <div className="text-slate-800 text-base leading-relaxed">
                          <MathText
                            content={content.explanation}
                            variables={variables}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MCQRenderer;
