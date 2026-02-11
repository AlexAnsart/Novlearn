"use client";

import { MessageSquare, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "./components/ActionButton";
import { Layout } from "./components/Layout";
import { MonthlyLeaderboard } from "./components/MonthlyLeaderboard";
import { FeedbackModal } from "./components/ui/FeedbackModal";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // État pour la modale de feedback
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false); // <--- AJOUT STATE

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const handleStartTraining = () => {
    router.push("/exercices");
  };

  return (
    <Layout>
      {/* 1. La Modale (Invisible par défaut) */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Math Exercise with S'entraîner button */}
          <div
            onClick={handleStartTraining}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[2.5rem] p-1 shadow-2xl shadow-indigo-500/30">
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.3rem] p-8 overflow-hidden">
                {/* Fond décoratif */}
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="absolute top-4 right-8 text-6xl"
                    style={{ fontFamily: "serif" }}
                  >
                    ∫
                  </div>
                  <div
                    className="absolute bottom-8 left-8 text-5xl"
                    style={{ fontFamily: "serif" }}
                  >
                    Σ
                  </div>
                  <div
                    className="absolute top-1/2 right-1/4 text-4xl"
                    style={{ fontFamily: "serif" }}
                  >
                    π
                  </div>
                  <div
                    className="absolute bottom-1/3 right-12 text-3xl"
                    style={{ fontFamily: "serif" }}
                  >
                    ∞
                  </div>
                  <div
                    className="absolute top-1/4 left-1/3 text-3xl"
                    style={{ fontFamily: "serif" }}
                  >
                    √
                  </div>
                </div>

                {/* Contenu */}
                <div className="relative z-10 text-center space-y-6">
                  {/* Icône animée */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                        <span className="text-4xl">🧠</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Texte */}
                  <div>
                    <h2
                      className="text-white text-2xl mb-2"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      Prêt à t'entraîner ?
                    </h2>
                    <p
                      className="text-slate-400 text-sm"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      Entraîne-toi sur des exercices adaptés à ton niveau
                    </p>
                  </div>

                  {/* Bouton principal */}
                  <button
                    className="
                    relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl
                    bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white 
                    shadow-[0_8px_0_0_rgba(67,56,202,1),0_15px_25px_rgba(99,102,241,0.4)]
                    transform transition-all duration-200 hover:scale-105 
                    active:shadow-[0_4px_0_0_rgba(67,56,202,1),0_8px_15px_rgba(99,102,241,0.4)] 
                    active:translate-y-1
                    group
                  "
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.5rem",
                    }}
                  >
                    <Play className="w-7 h-7 fill-white group-hover:scale-110 transition-transform" />
                    S'entraîner
                  </button>
                </div>
              </div>
            </div>
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
              onClick={() => router.push("/entrainement")}
            >
              Réviser les astuces
            </ActionButton>
          </div>

          {/* Classement du mois - Version compacte */}
          <div className="mt-4">
            <MonthlyLeaderboard compact limit={5} />
          </div>
        </div>
      </div>

      {/* 2. Bouton Flottant "Feedback" (En bas à droite) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-white text-indigo-600 rounded-full shadow-xl hover:bg-indigo-50 hover:shadow-2xl hover:scale-110 transition-all duration-300 z-40 border border-indigo-100 group"
        title="Donner votre avis ou signaler un bug"
      >
        <MessageSquare className="w-6 h-6" />

        {/* Tooltip au survol (Optionnel, pour le style) */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Un avis ? Un bug ?
        </span>
      </button>
    </Layout>
  );
}
