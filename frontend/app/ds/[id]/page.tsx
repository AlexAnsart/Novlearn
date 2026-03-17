"use client";

import { ArrowLeft, BookOpen, CalendarDays, Clock, Dumbbell, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { dsApi, DSDetail, DSCompetenceScore } from "../../lib/api";
import { useTaxonomyStore } from "../../store/useTaxonomyStore";

function formatDeadline(deadline: string): string {
  try {
    return new Date(deadline).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return deadline;
  }
}

function timeRemaining(deadline: string): string {
  try {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h restants`;
    return `${hours}h restantes`;
  } catch {
    return "";
  }
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DSDashboardPage() {
  const params = useParams();
  const dsId = params.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getCompetenceById, isLoaded, loadData } = useTaxonomyStore();

  const [ds, setDs] = useState<DSDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!isLoaded) loadData();
    dsApi
      .getDSDetail(dsId)
      .then(setDs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, dsId, router, isLoaded, loadData]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !ds) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-red-300" style={{ fontFamily: "'Fredoka', sans-serif" }}>
          ❌ {error || "DS introuvable"}
        </p>
        <button
          onClick={() => router.push("/ds")}
          className="text-slate-400 hover:text-white transition-colors"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          ← Retour aux DS
        </button>
      </div>
    );
  }

  const isActive = ds.status === "active";
  const totalPoints = ds.scores.reduce((sum, s) => sum + s.points, 0);
  const totalMax = ds.scores.reduce((sum, s) => sum + s.max_points, 0);
  const globalPct = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0;

  // Groupe les scores par chapitre via le store taxonomy
  const scoresByChapter: Record<string, { score: DSCompetenceScore; name: string }[]> = {};
  for (const score of ds.scores) {
    const comp = getCompetenceById(score.competence_id);
    const chapter = comp?.chapter || "Autres";
    if (!scoresByChapter[chapter]) scoresByChapter[chapter] = [];
    scoresByChapter[chapter].push({ score, name: comp?.name || score.competence_id });
  }

  return (
    <div className="flex-1 flex flex-col px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
      {/* Back + header */}
      <button
        onClick={() => router.push("/ds")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 w-fit"
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Mes DS
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-2xl md:text-3xl tracking-tight bg-gradient-to-r from-white via-violet-100 to-indigo-100 bg-clip-text text-transparent truncate"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {ds.title}
            </h1>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span
                className="flex items-center gap-1 text-slate-400 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDeadline(ds.deadline)}
              </span>
              {isActive && (
                <span
                  className="flex items-center gap-1 text-amber-400 text-sm"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {timeRemaining(ds.deadline)}
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isActive
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-slate-600/40 text-slate-400 border border-slate-600/30"
          }`}
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          {isActive ? "Actif" : "Expiré"}
        </span>
      </div>

      {/* Progression globale */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-slate-200 text-sm"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Progression globale
          </span>
          <span
            className="text-violet-300 text-lg font-bold"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            {globalPct}%
          </span>
        </div>
        <ProgressBar value={totalPoints} max={totalMax} />
        <p
          className="text-slate-500 text-xs mt-2"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          {totalPoints} / {totalMax} points · {ds.scores.length} compétence{ds.scores.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Bouton S'entraîner */}
      {isActive && (
        <button
          onClick={() => router.push(`/ds/${ds.id}/exercices`)}
          className="flex items-center justify-center gap-3 w-full py-4 mb-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30 transition-all text-lg"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          <Dumbbell className="w-5 h-5" />
          S'entraîner
        </button>
      )}

      {/* Scores par chapitre */}
      {ds.scores.length > 0 && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <h2
            className="text-slate-200 text-sm mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Progression par compétence
          </h2>
          <div className="flex flex-col gap-5">
            {Object.entries(scoresByChapter).map(([chapter, items]) => (
              <div key={chapter}>
                <p
                  className="text-slate-400 text-xs uppercase tracking-wide mb-2"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  {chapter}
                </p>
                <div className="flex flex-col gap-3">
                  {items.map(({ score, name }) => {
                    const pct = score.max_points > 0
                      ? Math.round((score.points / score.max_points) * 100)
                      : 0;
                    return (
                      <div key={score.competence_id}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-slate-300 text-sm"
                            style={{ fontFamily: "'Fredoka', sans-serif" }}
                          >
                            {name}
                          </span>
                          <span
                            className="text-slate-400 text-xs"
                            style={{ fontFamily: "'Fredoka', sans-serif" }}
                          >
                            {score.points}/{score.max_points} pts · {pct}%
                          </span>
                        </div>
                        <ProgressBar value={score.points} max={score.max_points} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DSDashboardPageWrapper() {
  return (
    <Layout>
      <DSDashboardPage />
    </Layout>
  );
}
