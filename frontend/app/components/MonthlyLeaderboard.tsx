'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  score: number;
  rank: number;
}

interface MonthlyLeaderboardProps {
  compact?: boolean; // Mode compact pour la page d'accueil
  limit?: number;
}

export function MonthlyLeaderboard({ compact = false, limit = 10 }: MonthlyLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Obtenir le premier jour du mois actuel
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Récupérer les scores mensuels (nombre de bonnes réponses par utilisateur)
      const { data, error } = await supabase.rpc('get_monthly_leaderboard', {
        month_start: firstDayOfMonth,
        result_limit: limit
      });

      if (error) {
        // Si la fonction RPC n'existe pas, utiliser une requête directe
        console.warn('RPC not available, using direct query');
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('exercise_attempts')
          .select(`
            user_id,
            is_correct,
            attempted_at,
            profiles:user_id (first_name, last_name)
          `)
          .eq('is_correct', true)
          .gte('attempted_at', firstDayOfMonth);

        if (attemptsError) throw attemptsError;

        // Agréger par utilisateur
        const scoreMap = new Map<string, { score: number; first_name: string | null; last_name: string | null }>();
        
        attemptsData?.forEach((attempt: any) => {
          const userId = attempt.user_id;
          const existing = scoreMap.get(userId);
          if (existing) {
            existing.score += 1;
          } else {
            scoreMap.set(userId, {
              score: 1,
              first_name: attempt.profiles?.first_name || null,
              last_name: attempt.profiles?.last_name || null
            });
          }
        });

        // Convertir en array et trier
        const sortedEntries = Array.from(scoreMap.entries())
          .map(([user_id, data]) => ({
            user_id,
            first_name: data.first_name,
            last_name: data.last_name,
            score: data.score,
            rank: 0
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        setLeaderboard(sortedEntries);

        // Trouver le rang de l'utilisateur actuel
        if (user) {
          const allEntries = Array.from(scoreMap.entries())
            .map(([user_id, data]) => ({ user_id, ...data, rank: 0 }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

          const currentUserEntry = allEntries.find(e => e.user_id === user.id);
          if (currentUserEntry) {
            setUserRank(currentUserEntry);
          }
        }
      } else {
        setLeaderboard(data || []);
        
        // Trouver le rang de l'utilisateur actuel
        if (user && data) {
          const currentUserEntry = data.find((e: LeaderboardEntry) => e.user_id === user.id);
          setUserRank(currentUserEntry || null);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du classement:', err);
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
        return <span className="w-5 h-5 flex items-center justify-center text-slate-400 font-bold text-sm">{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-amber-600/30';
      default:
        return 'bg-slate-800/40 border-slate-700/30';
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.first_name && entry.last_name) {
      return `${entry.first_name} ${entry.last_name.charAt(0)}.`;
    }
    if (entry.first_name) {
      return entry.first_name;
    }
    return 'Utilisateur';
  };

  const getCurrentMonthName = () => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[new Date().getMonth()];
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} flex items-center justify-center`}>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
        {/* Header compact */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold text-sm">Classement {getCurrentMonthName()}</h3>
          </div>
          <button
            onClick={() => router.push('/classement')}
            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
          >
            Voir tout
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top 3 compact */}
        <div className="space-y-2">
          {leaderboard.slice(0, 3).map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg border ${getRankBgColor(entry.rank)} ${
                user?.id === entry.user_id ? 'ring-2 ring-indigo-500/50' : ''
              }`}
            >
              {getRankIcon(entry.rank)}
              <span className="text-white text-sm flex-1 truncate">{getDisplayName(entry)}</span>
              <span className="text-indigo-300 text-sm font-medium">{entry.score} pts</span>
            </div>
          ))}
        </div>

        {/* Position de l'utilisateur si pas dans le top 3 */}
        {userRank && userRank.rank > 3 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
              <span className="w-5 h-5 flex items-center justify-center text-indigo-300 font-bold text-sm">
                {userRank.rank}
              </span>
              <span className="text-white text-sm flex-1">Vous</span>
              <span className="text-indigo-300 text-sm font-medium">{userRank.score} pts</span>
            </div>
          </div>
        )}

        {leaderboard.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-4">
            Aucun classement disponible ce mois-ci
          </p>
        )}
      </div>
    );
  }

  // Version complète
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Classement du mois</h2>
          <p className="text-slate-400 text-sm">{getCurrentMonthName()} {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.02] ${getRankBgColor(entry.rank)} ${
              user?.id === entry.user_id ? 'ring-2 ring-indigo-500/50' : ''
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex-1">
              <span className="text-white font-medium">
                {user?.id === entry.user_id ? 'Vous' : getDisplayName(entry)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-indigo-300 font-bold">{entry.score}</span>
              <span className="text-slate-400 text-sm ml-1">points</span>
            </div>
          </div>
        ))}
      </div>

      {/* Position de l'utilisateur si pas dans la liste */}
      {userRank && !leaderboard.find(e => e.user_id === user?.id) && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-slate-400 text-sm mb-2">Votre position</p>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <div className="w-8 flex justify-center">
              <span className="text-indigo-300 font-bold">{userRank.rank}</span>
            </div>
            <div className="flex-1">
              <span className="text-white font-medium">Vous</span>
            </div>
            <div className="text-right">
              <span className="text-indigo-300 font-bold">{userRank.score}</span>
              <span className="text-slate-400 text-sm ml-1">points</span>
            </div>
          </div>
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Aucun classement disponible ce mois-ci</p>
          <p className="text-slate-500 text-sm mt-1">Soyez le premier à gagner des points !</p>
        </div>
      )}
    </div>
  );
}
