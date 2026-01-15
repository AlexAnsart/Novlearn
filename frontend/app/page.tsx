"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActionButton } from "./components/ActionButton";
import { Layout } from "./components/Layout";
import { MathExercise } from "./components/MathExercise";
import { useAuth } from "./contexts/AuthContext";
// Plus besoin d'importer Supabase ici !

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Plus besoin de state pour l'exerciceId

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // On a supprimé le useEffect qui allait chercher un ID fixe

  const handleStartTraining = () => {
    // On redirige simplement vers la page d'entraînement.
    // Sans ID dans l'URL, le ExerciseLoader déclenchera son mode "Aléatoire".
    // Note: Assurez-vous que la route est bien '/entrainement' (celle qu'on a corrigée)
    router.push("/exercices");
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Math Exercise with S'entraîner button */}
          <div
            onClick={handleStartTraining}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <MathExercise />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <ActionButton
              variant="primary"
              icon="⚔️"
              onClick={() => router.push("/duel")}
            >
              1VS1
            </ActionButton>

            <ActionButton
              variant="secondary"
              icon="📚"
              onClick={() => router.push("/cours")}
            >
              Réviser le cours
            </ActionButton>
          </div>
        </div>
      </div>
    </Layout>
  );
}
