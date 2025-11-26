'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Award } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserStats {
  exercises_completed: number;
  level: string;
}

export function AccountPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchUserStats();
    }
  }, [user, authLoading, router]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Récupérer le nombre total d'exercices réalisés
      const { data: attempts, error: attemptsError } = await supabase
        .from('exercise_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Récupérer la progression pour déterminer le niveau
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (attemptsError || progressError) {
        console.error('Error fetching stats:', attemptsError || progressError);
        setStats({ exercises_completed: 0, level: 'Terminale' });
      } else {
        const exercisesCompleted = attempts?.length || 0;
        // Pour l'instant, on garde "Terminale" comme niveau par défaut
        // Plus tard, on pourra calculer le niveau basé sur la progression
        setStats({
          exercises_completed: exercisesCompleted,
          level: 'Terminale',
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStats({ exercises_completed: 0, level: 'Terminale' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-4xl w-full space-y-6">
        {/* Titre */}
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mon compte
          </h2>
        </div>

        {/* Carte profil */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {/* Avatar et nom */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-500 to-gray-700 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
              <User className="w-16 h-16 text-white" />
            </div>
            <h3
              className="text-white text-3xl"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {profile.first_name.toUpperCase() || 'UTILISATEUR'}
            </h3>
          </div>

          {/* Informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Email
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {profile.email || user.email}
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Membre depuis
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {formatDate(profile.created_at)}
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-blue-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Exercices réalisés
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
              >
                {stats?.exercises_completed || 0}
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Niveau
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
              >
                {stats?.level || 'Terminale'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

