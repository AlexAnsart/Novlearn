"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGuestMode } from "@/app/hooks/useGuestMode";

export default function AccueilPage() {
  const router = useRouter();
  const { startGuestSession } = useGuestMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTryFree = async () => {
    setLoading(true);
    setError(null);
    try {
      await startGuestSession();
      router.push("/");
    } catch {
      setError("Impossible de démarrer la session. Réessaie dans un instant.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div
          className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          NovLearn
        </div>
        <button
          onClick={() => router.push("/auth/login")}
          className="text-slate-300 hover:text-white text-sm px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-all"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
        >
          Se connecter
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-8 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-900/50 border border-indigo-700/50 rounded-full px-4 py-1.5">
          <span className="text-indigo-300 text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            🎓 Révision Bac • Maths • Gratuit
          </span>
        </div>

        {/* Title */}
        <div className="space-y-4 max-w-2xl">
          <h1
            className="text-5xl md:text-6xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Révise les maths du Bac{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              en t'amusant
            </span>
          </h1>
          <p
            className="text-slate-300 text-lg md:text-xl max-w-xl mx-auto"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Exercices adaptatifs, duels 1V1, classement et progression
            personnalisée. Tout ce dont tu as besoin pour réussir ton Bac.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-lg"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Créer un compte
          </button>
          <button
            onClick={handleTryFree}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            {loading ? "Démarrage…" : "Essayer gratuitement →"}
          </button>
        </div>

        {error && (
          <p
            className="text-red-400 text-sm"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            {error}
          </p>
        )}

        <p
          className="text-slate-500 text-xs"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
        >
          Mode découverte • 5 exercices gratuits • Sans inscription
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mt-4">
          {[
            {
              icon: "🧠",
              title: "Exercices adaptatifs",
              desc: "Difficulté ajustée à ton niveau en temps réel",
            },
            {
              icon: "⚔️",
              title: "Duels 1V1",
              desc: "Affronte tes amis en mathématiques en direct",
            },
            {
              icon: "🏆",
              title: "Classement",
              desc: "Compare-toi aux autres et grimpe dans le top",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 text-left space-y-2"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3
                className="text-white font-bold"
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                }}
              >
                {f.title}
              </h3>
              <p
                className="text-slate-400 text-sm"
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 400,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
