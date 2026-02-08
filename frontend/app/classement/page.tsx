"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Layout } from "../components/Layout";
import { MonthlyLeaderboard } from "../components/MonthlyLeaderboard";
import { useAuth } from "../contexts/AuthContext";

export default function ClassementPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Titre de la page */}
          <div className="mb-6">
            <h1
              className="text-3xl text-white mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Classement du mois
            </h1>
            <p className="text-slate-400">
              Comparez vos performances avec les autres utilisateurs
            </p>
          </div>

          {/* Classement complet */}
          <MonthlyLeaderboard limit={50} />

          {/* Info */}
          <div className="mt-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <h3 className="text-white font-medium mb-2">
              Comment gagner des points ?
            </h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Chaque exercice réussi vous rapporte des points</li>
              <li>• Le classement est réinitialisé au début de chaque mois</li>
              <li>• Entraînez-vous régulièrement pour rester au sommet !</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
