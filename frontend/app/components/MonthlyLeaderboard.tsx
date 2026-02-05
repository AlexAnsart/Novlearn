'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, ChevronRight, Loader2, Flame } from 'lucide-react'; // Ajout de Flame
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  score: number;
  best_streak: number; // Nouvelle propriété
  rank: number;
}

interface MonthlyLeaderboardProps {
  compact?: boolean; 
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
      
      const now = new Date();
      // Important : Toujours envoyer une date ISO valide pour le début du mois
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data, error } = await supabase.rpc('get_monthly_leaderboard', {
        month_start: firstDayOfMonth,
        result_limit: limit
      });

      if (error) throw error;

      if (data) {
        setLeaderboard(data);
        
        // Trouver le rang de l'utilisateur actuel
        if (user) {
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
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-slate-300" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-slate-400 font-bold text-sm">{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/30';
      case 3: return 'bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-amber-600/30';
      default: return 'bg-slate-800/40 border-slate-700/30';
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.first_name && entry.last_name) {
      return `${entry.first_name} ${entry.last_name.charAt(0)}.`;
    }
    return entry.first_name || 'Utilisateur';
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('fr-FR', { month: 'long' });
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} flex items-center justify-center`}>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // --- VERSION COMPACTE (Widget Dashboard) ---
  if (compact) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold text-sm capitalize">{getCurrentMonthName()}</h3>
          </div>
          <button
            onClick={() => router.push('/classement')}
            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {leaderboard.slice(0, 3).map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg border ${getRankBgColor(entry.rank)} ${
                user?.id === entry.user_id ? 'ring-2 ring-indigo-500/50' : ''
              }`}
            >
              {getRankIcon(entry.rank)}
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm block truncate">{getDisplayName(entry)}</span>
              </div>
              
              {/* Affichage du Streak en compact */}
              {entry.best_streak > 2 && (
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-3 h-3 fill-orange-400" />
                  <span className="text-xs font-bold">{entry.best_streak}</span>
                </div>
              )}
              
              <span className="text-indigo-300 text-sm font-medium whitespace-nowrap">{entry.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- VERSION COMPLÈTE (Page Classement) ---
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Classement du mois</h2>
          <p className="text-slate-400 text-sm capitalize">{getCurrentMonthName()} {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.01] ${getRankBgColor(entry.rank)} ${
              user?.id === entry.user_id ? 'ring-2 ring-indigo-500/50' : ''
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <span className="text-white font-medium">
                {user?.id === entry.user_id ? 'Vous' : getDisplayName(entry)}
              </span>
              
              {/* Badge Streak */}
              {entry.best_streak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold" title="Meilleure série du mois">
                  <Flame className="w-3 h-3 fill-orange-400" />
                  {entry.best_streak}
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-indigo-300 font-bold text-lg">{entry.score}</span>
              <span className="text-slate-400 text-sm ml-1">pts</span>
            </div>
          </div>
        ))}
      </div>

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