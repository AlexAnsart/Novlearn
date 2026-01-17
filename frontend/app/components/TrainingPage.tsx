"use client";

import {
  ArrowLeft,
  Book,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation"; // Pour la redirection
import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Chapter {
  id: string;
  name: string;
  emoji: string;
  notSeenYet: boolean;
}

interface FlashCard {
  question: string;
  answer: string;
}

// Vos données statiques (Chapitres et Flashcards) restent inchangées...
const chapters: Chapter[] = [
  { id: "suites", name: "Suites et limites", emoji: "📊", notSeenYet: true },
  {
    id: "Fonctions",
    name: "Fonctions",
    emoji: "➡️",
    notSeenYet: true,
  },
  { id: "derivabilite", name: "Dérivabilité", emoji: "📈", notSeenYet: true },
  {
    id: "logarithme",
    name: "Logarithme néperien",
    emoji: "📉",
    notSeenYet: true,
  },
  {
    id: "primitives",
    name: "Primitives et équadiff",
    emoji: "∫",
    notSeenYet: true,
  },
  { id: "convexite", name: "Convexité", emoji: "⌒", notSeenYet: true },
  { id: "stats", name: "Stats", emoji: "📊", notSeenYet: true },
  { id: "probas", name: "Probas", emoji: "🎲", notSeenYet: true },
];

const flashCardsData: Record<string, FlashCard[]> = {
  suites: [
    {
      question: "Qu'est-ce qu'une suite arithmétique ?",
      answer:
        "Une suite où la différence entre deux termes consécutifs est constante (raison r).",
    },
    {
      question: "Qu'est-ce qu'une suite géométrique ?",
      answer:
        "Une suite où le quotient entre deux termes consécutifs est constant (raison q).",
    },
    {
      question: "Comment calculer la limite d'une suite ?",
      answer:
        "On étudie le comportement de la suite lorsque n tend vers l'infini.",
    },
  ],
  limites: [
    {
      question: "Qu'est-ce qu'une limite finie ?",
      answer:
        "Une fonction f admet une limite finie L en a si f(x) se rapproche de L quand x tend vers a.",
    },
    {
      question: "Qu'est-ce qu'une asymptote verticale ?",
      answer: "Une droite d'équation x = a où la fonction tend vers l'infini.",
    },
  ],
  derivabilite: [
    {
      question: "Quelle est la définition de la dérivée ?",
      answer:
        "La dérivée est le taux de variation instantané d'une fonction en un point.",
    },
    { question: "Quelle est la dérivée de x^n ?", answer: "n × x^(n-1)" },
  ],
  logarithme: [
    { question: "Qu'est-ce que ln(1) ?", answer: "ln(1) = 0" },
    {
      question: "Quelle est la propriété principale du logarithme ?",
      answer: "ln(a × b) = ln(a) + ln(b)",
    },
  ],
  primitives: [
    {
      question: "Qu'est-ce qu'une primitive ?",
      answer: "Une fonction F est une primitive de f si F' = f",
    },
    {
      question: "Quelle est la primitive de x^n ?",
      answer: "x^(n+1)/(n+1) + C",
    },
  ],
  convexite: [
    {
      question: "Qu'est-ce qu'une fonction convexe ?",
      answer:
        "Une fonction dont la dérivée seconde est positive sur un intervalle.",
    },
    {
      question: "Qu'est-ce qu'un point d'inflexion ?",
      answer: "Un point où la fonction change de convexité.",
    },
  ],
  stats: [
    {
      question: "Qu'est-ce la moyenne ?",
      answer:
        "La somme de toutes les valeurs divisée par le nombre de valeurs.",
    },
    {
      question: "Qu'est-ce la médiane ?",
      answer: "La valeur qui sépare les données en deux parties égales.",
    },
  ],
  probas: [
    {
      question: "Qu'est-ce qu'une probabilité ?",
      answer:
        "Un nombre entre 0 et 1 qui mesure la chance qu'un événement se produise.",
    },
    {
      question: "Quelle est la formule de la probabilité conditionnelle ?",
      answer: "P(A|B) = P(A ∩ B) / P(B)",
    },
  ],
};

export function TrainingPage() {
  const router = useRouter();

  const [chapterStates, setChapterStates] = useState<Record<string, boolean>>(
    chapters.reduce(
      (acc, chapter) => ({ ...acc, [chapter.id]: chapter.notSeenYet }),
      {},
    ),
  );

  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"exercises" | "course" | null>(
    null,
  );
  const [selectedExerciseType, setSelectedExerciseType] = useState<
    "flash" | "long" | null
  >(null);

  // Flashcards state
  const [currentFlashCardIndex, setCurrentFlashCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Loading state pour la recherche d'exercice
  const [isSearchingExercise, setIsSearchingExercise] = useState(false);

  const handleToggleNotSeen = (chapterId: string) => {
    setChapterStates((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleChapterClick = (chapterId: string) => {
    setSelectedChapter(chapterId);
    setSelectedTab(null);
    setSelectedExerciseType(null);
    setCurrentFlashCardIndex(0);
    setIsFlipped(false);
  };

  const handleBack = () => {
    if (selectedExerciseType) {
      setSelectedExerciseType(null);
    } else if (selectedTab) {
      setSelectedTab(null);
    } else {
      setSelectedChapter(null);
    }
  };

  // --- LOGIQUE FLASHCARDS ---
  const handleNextCard = () => {
    const currentChapter = chapters.find((c) => c.id === selectedChapter);
    if (currentChapter) {
      const cards = flashCardsData[currentChapter.id] || [];
      setCurrentFlashCardIndex((prev) => (prev + 1) % cards.length);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    const currentChapter = chapters.find((c) => c.id === selectedChapter);
    if (currentChapter) {
      const cards = flashCardsData[currentChapter.id] || [];
      setCurrentFlashCardIndex(
        (prev) => (prev - 1 + cards.length) % cards.length,
      );
      setIsFlipped(false);
    }
  };

  // --- LOGIQUE LANCEMENT EXERCICE CHAPITRE ---
  const handleStartChapterExercise = async () => {
    if (!selectedChapter) return;
    setIsSearchingExercise(true);

    try {
      // 1. On retrouve le nom du chapitre tel qu'il est probablement écrit en BDD
      // (On utilise .name car en BDD c'est souvent "Suites et limites" et non "suites")
      const currentChapterObj = chapters.find((c) => c.id === selectedChapter);
      const chapterNameInDb = currentChapterObj?.name;

      // 2. On cherche TOUS les IDs d'exercices de ce chapitre
      const { data, error } = await supabase
        .from("exercises")
        .select("id")
        .eq("chapter", chapterNameInDb); // Filtre par nom de chapitre

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(
          "Désolé, aucun exercice n'est encore disponible pour ce chapitre.",
        );
        setIsSearchingExercise(false);
        return;
      }

      // 3. On en tire un au hasard
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomExerciseId = data[randomIndex].id;

      // 4. On redirige vers la page d'entraînement avec l'ID précis
      // Note : Assurez-vous que votre page d'exercice est bien sur /exercices
      router.push(`/exercices?id=${randomExerciseId}`);
    } catch (err) {
      console.error("Erreur lors de la recherche d'exercice :", err);
      alert("Impossible de charger un exercice pour le moment.");
      setIsSearchingExercise(false);
    }
  };

  // ----------------------------------------------------------------------------------
  // RENDER : COURS (Flashcards)
  // ----------------------------------------------------------------------------------
  if (selectedChapter && selectedTab === "course") {
    const currentChapter = chapters.find((c) => c.id === selectedChapter);
    const cards = flashCardsData[selectedChapter] || [];
    const currentCard = cards[currentFlashCardIndex];

    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>

          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Flash Cards - {currentChapter?.name}
            </h2>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevCard}
                className="p-3 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <span
                className="text-blue-200"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                {currentFlashCardIndex + 1} / {cards.length}
              </span>

              <button
                onClick={handleNextCard}
                className="p-3 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl transition-all"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-12 min-h-[300px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-2xl"
              style={{ perspective: "1000px" }}
            >
              <p
                className="text-white text-center text-2xl"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                {isFlipped ? currentCard.answer : currentCard.question}
              </p>
            </div>

            <p
              className="text-blue-200 text-center mt-4"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
            >
              Cliquez sur la carte pour voir{" "}
              {isFlipped ? "la question" : "la réponse"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // RENDER : SELECTION EXERCICE (Menu Flash vs Long)
  // ----------------------------------------------------------------------------------
  if (selectedChapter && selectedTab === "exercises") {
    const currentChapter = chapters.find((c) => c.id === selectedChapter);

    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>

          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Exercices - {currentChapter?.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BOUTON EXERCICE FLASH (Modifié pour lancer la recherche) */}
            <button
              onClick={handleStartChapterExercise}
              disabled={isSearchingExercise}
              className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-wait"
            >
              <div className="text-center flex flex-col items-center">
                {isSearchingExercise ? (
                  <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
                ) : (
                  <div className="text-6xl mb-4">⚡</div>
                )}

                <h3
                  className="text-white text-2xl"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {isSearchingExercise ? "Recherche..." : "Exercice flash"}
                </h3>
              </div>
            </button>

            {/* BOUTON EXERCICE LONG (Pas encore dispo) */}
            <button
              onClick={() => setSelectedExerciseType("long")}
              className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:scale-105 transition-transform"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3
                  className="text-white text-2xl"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Exercice long
                </h3>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // RENDER : PLACEHOLDER EXERCICE LONG
  // ----------------------------------------------------------------------------------
  if (
    selectedChapter &&
    selectedTab === "exercises" &&
    selectedExerciseType === "long"
  ) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <p
              className="text-white text-center text-xl"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Cette option n'est pas encore disponible
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // RENDER : SELECTION TAB (Exercices vs Cours)
  // ----------------------------------------------------------------------------------
  if (selectedChapter) {
    const currentChapter = chapters.find((c) => c.id === selectedChapter);
    const isNotSeen = chapterStates[selectedChapter];

    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>

          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {currentChapter?.emoji} {currentChapter?.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedTab("exercises")}
              className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:scale-105 transition-transform"
            >
              <div className="text-center">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <h3
                  className="text-white text-2xl"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Exercices
                </h3>
              </div>
            </button>

            <button
              onClick={() => setSelectedTab("course")}
              className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:scale-105 transition-transform"
            >
              <div className="text-center">
                <Book className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h3
                  className="text-white text-2xl"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Cours
                </h3>
              </div>
            </button>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isNotSeen}
                onChange={() => handleToggleNotSeen(selectedChapter)}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
              />
              <span
                className="text-white"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                Je n'ai pas encore vu ce chapitre
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // RENDER : ACCUEIL (Liste des chapitres)
  // ----------------------------------------------------------------------------------
  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-6xl w-full space-y-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            S'entraîner
          </h2>
          <p
            className="text-blue-200 mt-2 drop-shadow-md"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Choisissez un chapitre pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleChapterClick(chapter.id)}
              className={`bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:scale-105 transition-transform ${
                chapterStates[chapter.id] ? "opacity-40 grayscale" : ""
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">{chapter.emoji}</div>
                <h3
                  className="text-white"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.125rem",
                  }}
                >
                  {chapter.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
