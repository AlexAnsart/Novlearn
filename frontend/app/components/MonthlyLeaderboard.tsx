"use client";

import {
  CalendarClock,
  ChevronRight,
  Crown,
  Flame,
  Loader2,
  Medal,
  Percent,
  Star,
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
  crown_count: number;
  star_count: number;
}

interface SuccessRateEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  success_rate: number;
  total_attempts: number;
  correct_attempts: number;
  rank: number;
  crown_count: number;
  star_count: number;
}

function RewardBadges({
  crown_count,
  star_count,
}: {
  crown_count: number;
  star_count: number;
}) {
  if (!crown_count && !star_count) return null;
  return (
    <div className="flex items-center gap-1">
      {crown_count > 0 && (
        <span className="flex items-center gap-0.5 bg-yellow-500/20 border border-yellow-400/40 rounded-full px-1.5 py-0.5">
          <Crown className="w-3 h-3 text-yellow-400" />
          <span className="text-yellow-300 text-xs font-bold">{crown_count}</span>
        </span>
      )}
      {star_count > 0 && (
        <span className="flex items-center gap-0.5 bg-indigo-500/20 border border-indigo-400/40 rounded-full px-1.5 py-0.5">
          <Star className="w-3 h-3 text-indigo-300" />
          <span className="text-indigo-200 text-xs font-bold">{star_count}</span>
        </span>
      )}
    </div>
  );
}

/** Barre de progression colorée selon le taux */
function SuccessRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 80
      ? "bg-emerald-500"
      : rate >= 60
        ? "bg-yellow-500"
        : "bg-red-500";
  return (
    <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${Math.min(rate, 100)}%` }}
      />
    </div>
  );
}

interface MonthlyLeaderboardProps {
  compact?: boolean;
  limit?: number;
  initialData?: LeaderboardEntry[];
  initialSortBy?: "score" | "streak";
  initialSuccessRateData?: SuccessRateEntry[];
}

type LeaderboardTab = "score" | "streak" | "success_rate";

export function MonthlyLeaderboard({
  compact = false,
  limit = 10,
  initialData,
  initialSortBy = "score",
  initialSuccessRateData,
}: MonthlyLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
    initialData || [],
  );
  const [successRateLeaderboard, setSuccessRateLeaderboard] = useState<
    SuccessRateEntry[]
  >(initialSuccessRateData || []);

  const [loading, setLoading] = useState(!initialData);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [userSuccessRank, setUserSuccessRank] =
    useState<SuccessRateEntry | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialSortBy);
  const [timeUntilReset, setTimeUntilReset] = useState("");

  const { user, isGuest } = useAuth();
  const router = useRouter();

  // Compteur avant réinitialisation (dimanche 23:59 UTC)
  useEffect(() => {
    const computeTimeLeft = () => {
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const nextSunday = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + daysUntilSunday,
          23,
          59,
          59,
        ),
      );
      const diff = nextSunday.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeUntilReset("Réinit. en cours...");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        setTimeUntilReset(`Réinit. dans ${d}j ${h % 24}h`);
      } else {
        setTimeUntilReset(`Réinit. dans ${h}h ${m}min`);
      }
    };
    computeTimeLeft();
    const interval = setInterval(computeTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialise le rang utilisateur depuis les données SSR
  useEffect(() => {
    if (initialData && user) {
      setUserRank(initialData.find((e) => e.user_id === user.id) || null);
    }
    if (initialSuccessRateData && user) {
      setUserSuccessRank(
        initialSuccessRateData.find((e) => e.user_id === user.id) || null,
      );
    }
  }, [initialData, initialSuccessRateData, user]);

  useEffect(() => {
    if (activeTab === "success_rate") {
      if (initialSuccessRateData && successRateLeaderboard.length > 0) return;
      fetchSuccessRateLeaderboard();
    } else {
      if (initialData && activeTab === initialSortBy && leaderboard.length > 0)
        return;
      fetchWeeklyLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - daysFromMonday,
      ),
    ).toISOString();
  };

  const fetchWeeklyLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_weekly_leaderboard", {
        week_start: getWeekStart(),
        result_limit: limit,
        sort_by: activeTab as "score" | "streak",
      });
      if (error) throw error;
      if (data) {
        setLeaderboard(data);
        if (user) {
          setUserRank(
            data.find((e: LeaderboardEntry) => e.user_id === user.id) || null,
          );
        }
      }
    } catch (err) {
      console.error("Erreur classement hebdomadaire:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuccessRateLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        "get_success_rate_leaderboard",
        { week_start: getWeekStart(), min_attempts: 10, result_limit: limit },
      );
      if (error) throw error;
      if (data) {
        setSuccessRateLeaderboard(data);
        if (user) {
          setUserSuccessRank(
            data.find((e: SuccessRateEntry) => e.user_id === user.id) || null,
          );
        }
      }
    } catch (err) {
      console.error("Erreur classement taux de réussite:", err);
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

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return "text-emerald-400";
    if (rate >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getDisplayName = (entry: { first_name: string | null; last_name: string | null }) => {
    if (entry.first_name && entry.last_name) {
      return `${entry.first_name} ${entry.last_name.charAt(0)}.`;
    }
    return entry.first_name || "Utilisateur";
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysFromMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `Semaine du ${fmt(monday)} au ${fmt(sunday)}`;
  };

  // ── TABS ─────────────────────────────────────────────────────────────────

  const renderTabs = (includeSuccessRate = true) => (
    <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4 border border-slate-700/50">
      <button
        onClick={() => setActiveTab("score")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
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
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "streak"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <Flame className="w-4 h-4 text-orange-500" />
        Série
      </button>
      {includeSuccessRate && (
        <button
          onClick={() => setActiveTab("success_rate")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "success_rate"
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Percent className="w-4 h-4 text-emerald-400" />
          Réussite
        </button>
      )}
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

  // ── VERSION COMPACTE ─────────────────────────────────────────────────────

  if (compact) {
    const displayList =
      activeTab === "success_rate"
        ? successRateLeaderboard.slice(0, 3)
        : leaderboard.slice(0, 3);

    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              {activeTab === "score" ? (
                <Trophy className="w-4 h-4 text-yellow-400" />
              ) : activeTab === "streak" ? (
                <Flame className="w-4 h-4 text-orange-500" />
              ) : (
                <Percent className="w-4 h-4 text-emerald-400" />
              )}
              {activeTab === "score"
                ? "Top Points"
                : activeTab === "streak"
                  ? "Top Série"
                  : "Taux de réussite"}{" "}
              {activeTab !== "success_rate" && "de la semaine"}
            </h3>
            {activeTab !== "success_rate" && timeUntilReset && (
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                <CalendarClock className="w-3 h-3" />
                {timeUntilReset}
              </p>
            )}
            {activeTab === "success_rate" && (
              <p className="text-slate-500 text-xs mt-0.5">min. 10 exercices</p>
            )}
          </div>
          {isGuest ? (
            <span
              className="text-slate-600 text-xs flex items-center gap-1 cursor-not-allowed"
              title="Crée un compte pour accéder au classement complet"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </span>
          ) : (
            <button
              onClick={() => router.push("/classement")}
              className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {renderTabs(true)}

        <div className="space-y-2 flex-1 overflow-hidden">
          {displayList.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg border ${getRankBgColor(entry.rank)} ${
                user?.id === entry.user_id ? "ring-2 ring-indigo-500/50" : ""
              }`}
            >
              {getRankIcon(entry.rank)}
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-white text-sm truncate">
                  {getDisplayName(entry)}
                </span>
                <RewardBadges
                  crown_count={entry.crown_count}
                  star_count={entry.star_count}
                />
              </div>
              <div className="text-right">
                {activeTab === "score" ? (
                  <span className="text-indigo-300 text-sm font-bold">
                    {(entry as LeaderboardEntry).score} pts
                  </span>
                ) : activeTab === "streak" ? (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    <span className="text-sm font-bold">
                      {(entry as LeaderboardEntry).best_streak}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`text-sm font-bold ${getSuccessRateColor((entry as SuccessRateEntry).success_rate)}`}
                  >
                    {(entry as SuccessRateEntry).success_rate}%
                  </span>
                )}
              </div>
            </div>
          ))}

          {displayList.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-4">
              Aucune donnée
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── VERSION COMPLÈTE ─────────────────────────────────────────────────────

  const isSuccessRateTab = activeTab === "success_rate";
  const currentList = isSuccessRateTab ? successRateLeaderboard : leaderboard;

  const tabTitle = {
    score: "Points de la semaine",
    streak: "Séries de la semaine",
    success_rate: "Taux de réussite de la semaine",
  }[activeTab];

  const tabSubtitle = isSuccessRateTab
    ? `${getCurrentWeekRange()} • Minimum 10 exercices`
    : getCurrentWeekRange();

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {activeTab === "score" ? (
              <Trophy className="w-6 h-6 text-white" />
            ) : activeTab === "streak" ? (
              <Flame className="w-6 h-6 text-white" />
            ) : (
              <Percent className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">
              Classement {tabTitle}
            </h2>
            <p className="text-slate-400 text-sm">{tabSubtitle}</p>
            {!isSuccessRateTab && timeUntilReset && (
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                <CalendarClock className="w-3 h-3" />
                {timeUntilReset} (dim. 23h59)
              </p>
            )}
          </div>
        </div>
        <div className="w-full md:w-72">{renderTabs(true)}</div>
      </div>

      {/* Position de l'utilisateur courant (si pas dans le top) */}
      {!isSuccessRateTab && userRank && !currentList.find((e) => e.user_id === user?.id) && (
        <div className="mb-4 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-4">
          <div className="w-8 flex justify-center">
            {getRankIcon(userRank.rank)}
          </div>
          <div className="flex-1 text-white font-medium">Votre position</div>
          <span className="text-indigo-300 font-bold">
            #{userRank.rank}
          </span>
        </div>
      )}
      {isSuccessRateTab && userSuccessRank && !currentList.find((e) => e.user_id === user?.id) && (
        <div className="mb-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-4">
          <div className="w-8 flex justify-center">
            {getRankIcon(userSuccessRank.rank)}
          </div>
          <div className="flex-1 text-white font-medium">Votre position</div>
          <span className={`font-bold ${getSuccessRateColor(userSuccessRank.success_rate)}`}>
            {userSuccessRank.success_rate}% (#{userSuccessRank.rank})
          </span>
        </div>
      )}

      <div className="space-y-2">
        {currentList.map((entry) =>
          isSuccessRateTab ? (
            // ── Ligne taux de réussite ──────────────────────────────────────
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.01] ${getRankBgColor(entry.rank)} ${
                user?.id === entry.user_id ? "ring-2 ring-indigo-500/50" : ""
              }`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-white font-medium truncate">
                    {user?.id === entry.user_id
                      ? "Vous"
                      : getDisplayName(entry)}
                  </span>
                  <RewardBadges
                    crown_count={entry.crown_count}
                    star_count={entry.star_count}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`font-bold text-lg ${getSuccessRateColor((entry as SuccessRateEntry).success_rate)}`}
                >
                  {(entry as SuccessRateEntry).success_rate}%
                </span>
                <SuccessRateBar rate={(entry as SuccessRateEntry).success_rate} />
                <span className="text-slate-500 text-xs">
                  {(entry as SuccessRateEntry).correct_attempts}/
                  {(entry as SuccessRateEntry).total_attempts} exercices
                </span>
              </div>
            </div>
          ) : (
            // ── Ligne score / streak ────────────────────────────────────────
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.01] ${getRankBgColor(entry.rank)} ${
                user?.id === entry.user_id ? "ring-2 ring-indigo-500/50" : ""
              }`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-white font-medium truncate">
                    {user?.id === entry.user_id
                      ? "Vous"
                      : getDisplayName(entry)}
                  </span>
                  <RewardBadges
                    crown_count={(entry as LeaderboardEntry).crown_count}
                    star_count={(entry as LeaderboardEntry).star_count}
                  />
                </div>
              </div>
              <div className="text-right flex items-center gap-6">
                <div
                  className={`flex items-center gap-1 ${activeTab === "streak" ? "opacity-100 scale-110" : "opacity-50"} transition-all`}
                >
                  <Flame
                    className={`w-4 h-4 ${activeTab === "streak" ? "text-orange-500 fill-orange-500" : "text-slate-400"}`}
                  />
                  <span
                    className={`font-bold ${activeTab === "streak" ? "text-orange-400" : "text-slate-400"}`}
                  >
                    {(entry as LeaderboardEntry).best_streak}
                  </span>
                </div>
                <div
                  className={`w-20 text-right ${activeTab === "score" ? "opacity-100" : "opacity-60"}`}
                >
                  <span
                    className={`font-bold text-lg ${activeTab === "score" ? "text-indigo-300" : "text-slate-400"}`}
                  >
                    {(entry as LeaderboardEntry).score}
                  </span>
                  <span className="text-slate-500 text-xs ml-1">pts</span>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {currentList.length === 0 && (
        <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
          {isSuccessRateTab ? (
            <Percent className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          ) : activeTab === "score" ? (
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          ) : (
            <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          )}
          <p className="text-slate-400">
            {isSuccessRateTab
              ? "Aucun utilisateur n'a encore réalisé 10 exercices"
              : `Aucun classement ${activeTab === "streak" ? "de série" : ""} disponible cette semaine`}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {isSuccessRateTab
              ? "Faites au moins 10 exercices pour apparaître ici !"
              : "Soyez le premier à apparaître ici !"}
          </p>
        </div>
      )}
    </div>
  );
}
