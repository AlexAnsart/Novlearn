"use client";

import {
  ChevronRight,
  Crown,
  Flame,
  Loader2,
  Medal,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface LeaderboardEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  score: number;
  best_streak: number;
  rank: number;
}

interface MonthlyLeaderboardProps {
  compact?: boolean;
  limit?: number;
  /** Données pré-chargées côté serveur (optionnel - optimisation SSR) */
  initialData?: LeaderboardEntry[];
  /** Tri initial quand des données sont pré-chargées */
  initialSortBy?: "score" | "streak";
}

type LeaderboardTab = "score" | "streak";

export function MonthlyLeaderboard({
  compact = false,
  limit = 10,
  initialData,
  initialSortBy = "score",
}: MonthlyLeaderboardProps) {
  // Utilise les données initiales si fournies (SSR), sinon démarre vide
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
    initialData || [],
  );
  // Si des données initiales sont fournies, pas de chargement initial
  const [loading, setLoading] = useState(!initialData);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialSortBy);

  const { user } = useAuth();
  const router = useRouter();

  // Initialise le rang utilisateur si données pré-chargées
  useEffect(() => {
    if (initialData && user) {
      const currentUserEntry = initialData.find((e) => e.user_id === user.id);
      setUserRank(currentUserEntry || null);
    }
  }, [initialData, user]);

  useEffect(() => {
    // Skip le premier fetch si on a des données initiales et qu'on est sur le même onglet
    if (initialData && activeTab === initialSortBy && leaderboard.length > 0) {
      return;
    }
    fetchLeaderboard();
  }, [user, activeTab]); // Recharger quand l'onglet change

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      const now = new Date();
      // Force UTC pour éviter le bug de timezone
      const firstDayOfMonth = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), 1),
      ).toISOString();

      const { data, error } = await supabase.rpc("get_monthly_leaderboard", {
        month_start: firstDayOfMonth,
        result_limit: limit,
        sort_by: activeTab, // On envoie le tri choisi à la base de données
      });

      if (error) throw error;

      if (data) {
        setLeaderboard(data);

        // Trouver le rang de l'utilisateur actuel dans ce classement spécifique
        if (user) {
          const currentUserEntry = data.find(
            (e: LeaderboardEntry) => e.user_id === user.id,
          );
          setUserRank(currentUserEntry || null);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement du classement:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-slate-400 font-bold text-sm">
            {rank}
          </span>
        );
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-amber-600/30";
      default:
        return "bg-slate-800/40 border-slate-700/30";
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.first_name && entry.last_name) {
      return `${entry.first_name} ${entry.last_name.charAt(0)}.`;
    }
    return entry.first_name || "Utilisateur";
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString("fr-FR", { month: "long" });
  };

  // --- RENDU DES ONGLETS (Tabs) ---
  const renderTabs = () => (
    <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4 border border-slate-700/50">
      <button
        onClick={() => setActiveTab("score")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "score"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <Trophy className="w-4 h-4 text-yellow-400" />
        Points
      </button>
      <button
        onClick={() => setActiveTab("streak")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "streak"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <Flame className="w-4 h-4 text-orange-500" />
        Série (Streak)
      </button>
    </div>
  );

  if (loading) {
    return (
      <div
        className={`${compact ? "p-4" : "p-6"} bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 flex items-center justify-center min-h-[200px]`}
      >
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // --- VERSION COMPACTE (Widget Dashboard) ---
  if (compact) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm capitalize flex items-center gap-2">
            {activeTab === "score" ? (
              <Trophy className="w-4 h-4 text-yellow-400" />
            ) : (
              <Flame className="w-4 h-4 text-orange-500" />
            )}
            Top {activeTab === "score" ? "Points" : "Série"}{" "}
            {getCurrentMonthName()}
          </h3>
          <button
            onClick={() => router.push("/classement")}
            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {renderTabs()}

        <div className="space-y-2 flex-1 overflow-hidden">
          {leaderboard.slice(0, 3).map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg border ${getRankBgColor(entry.rank)} ${
                user?.id === entry.user_id ? "ring-2 ring-indigo-500/50" : ""
              }`}
            >
              {getRankIcon(entry.rank)}
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm block truncate">
                  {getDisplayName(entry)}
                </span>
              </div>

              <div className="text-right">
                {activeTab === "score" ? (
                  <span className="text-indigo-300 text-sm font-bold">
                    {entry.score} pts
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    <span className="text-sm font-bold">
                      {entry.best_streak}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-4">
              Aucune donnée
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- VERSION COMPLÈTE (Page Classement) ---
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {activeTab === "score" ? (
              <Trophy className="w-6 h-6 text-white" />
            ) : (
              <Flame className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">
              Classement {activeTab === "score" ? "Général" : "Séries"}
            </h2>
            <p className="text-slate-400 text-sm capitalize">
              {getCurrentMonthName()} {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="w-full md:w-64">{renderTabs()}</div>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.01] ${getRankBgColor(entry.rank)} ${
              user?.id === entry.user_id ? "ring-2 ring-indigo-500/50" : ""
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>

            <div className="flex-1 flex items-center gap-3">
              <span className="text-white font-medium">
                {user?.id === entry.user_id ? "Vous" : getDisplayName(entry)}
              </span>
            </div>

            <div className="text-right flex items-center gap-6">
              {/* On affiche les deux infos, mais on met en valeur celle de l'onglet actif */}

              {/* Info Série */}
              <div
                className={`flex items-center gap-1 ${activeTab === "streak" ? "opacity-100 scale-110" : "opacity-50"} transition-all`}
              >
                <Flame
                  className={`w-4 h-4 ${activeTab === "streak" ? "text-orange-500 fill-orange-500" : "text-slate-400"}`}
                />
                <span
                  className={`font-bold ${activeTab === "streak" ? "text-orange-400" : "text-slate-400"}`}
                >
                  {entry.best_streak}
                </span>
              </div>

              {/* Info Points */}
              <div
                className={`w-20 text-right ${activeTab === "score" ? "opacity-100" : "opacity-60"}`}
              >
                <span
                  className={`font-bold text-lg ${activeTab === "score" ? "text-indigo-300" : "text-slate-400"}`}
                >
                  {entry.score}
                </span>
                <span className="text-slate-500 text-xs ml-1">pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
          {activeTab === "score" ? (
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          ) : (
            <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          )}
          <p className="text-slate-400">
            Aucun classement {activeTab === "streak" ? "de série" : ""}{" "}
            disponible ce mois-ci
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Soyez le premier à apparaître ici !
          </p>
        </div>
      )}
    </div>
  );
}
