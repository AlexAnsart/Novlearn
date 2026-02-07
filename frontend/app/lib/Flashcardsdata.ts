export interface FlashCard {
  question: string;
  answer: string;
}

export const flashCardsData: Record<string, FlashCard[]> = {
  "Suites numériques": [
    {
      question: "Qu'est-ce qu'une suite arithmétique ?",
      answer: "Une suite où la différence entre deux termes consécutifs est constante (raison r).",
    },
    {
      question: "Qu'est-ce qu'une suite géométrique ?",
      answer: "Une suite où le quotient entre deux termes consécutifs est constant (raison q).",
    },
    {
      question: "Comment calculer la limite d'une suite ?",
      answer: "On étudie le comportement de la suite lorsque n tend vers l'infini.",
    },
  ],
  "Limites et continuité": [
    {
      question: "Qu'est-ce qu'une limite finie ?",
      answer: "Une fonction f admet une limite finie L en a si f(x) se rapproche de L quand x tend vers a.",
    },
    {
      question: "Qu'est-ce qu'une asymptote verticale ?",
      answer: "Une droite d'équation x = a où la fonction tend vers l'infini.",
    },
  ],
  "Fonctions": [], 
  "Dérivabilité": [
    {
      question: "Quelle est la définition de la dérivée ?",
      answer: "La dérivée est le taux de variation instantané d'une fonction en un point.",
    },
    { question: "Quelle est la dérivée de x^n ?", answer: "n × x^(n-1)" },
  ],
  "Logarithme néperien": [
    { question: "Qu'est-ce que ln(1) ?", answer: "ln(1) = 0" },
    {
      question: "Quelle est la propriété principale du logarithme ?",
      answer: "ln(a × b) = ln(a) + ln(b)",
    },
  ],
  "Primitives et équadiff": [
    {
      question: "Qu'est-ce qu'une primitive ?",
      answer: "Une fonction F est une primitive de f si F' = f",
    },
    {
      question: "Quelle est la primitive de x^n ?",
      answer: "x^(n+1)/(n+1) + C",
    },
  ],
  "Convexité": [
    {
      question: "Qu'est-ce qu'une fonction convexe ?",
      answer: "Une fonction dont la dérivée seconde est positive sur un intervalle.",
    },
    {
      question: "Qu'est-ce qu'un point d'inflexion ?",
      answer: "Un point où la fonction change de convexité.",
    },
  ],
  "Stats": [
    {
      question: "Qu'est-ce la moyenne ?",
      answer: "La somme de toutes les valeurs divisée par le nombre de valeurs.",
    },
    {
      question: "Qu'est-ce la médiane ?",
      answer: "La valeur qui sépare les données en deux parties égales.",
    },
  ],
  "Probas": [
    {
      question: "Qu'est-ce qu'une probabilité ?",
      answer: "Un nombre entre 0 et 1 qui mesure la chance qu'un événement se produise.",
    },
    {
      question: "Quelle est la formule de la probabilité conditionnelle ?",
      answer: "P(A|B) = P(A ∩ B) / P(B)",
    },
  ],
};