'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Award, Users } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Friend {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  exercisesCompleted: number;
  level: string;
}

interface FriendRequest {
  id: string;
  from: string;
  fromId: string;
}

interface UserStats {
  exercises_completed: number;
  level: string;
}

export function AccountPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");
  
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: "1",
      name: "MathPro2024",
      email: "mathpro@novlearn.fr",
      memberSince: "Août 2024",
      exercisesCompleted: 58,
      level: "Terminale",
    },
    {
      id: "2",
      name: "Einstein42",
      email: "einstein42@novlearn.fr",
      memberSince: "Septembre 2024",
      exercisesCompleted: 35,
      level: "Terminale",
    },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    {
      id: "1",
      from: "CalculGenius",
      fromId: "3",
    },
  ]);

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleAcceptFriendRequest = (request: FriendRequest) => {
    const newFriend: Friend = {
      id: request.fromId,
      name: request.from,
      email: `${request.from.toLowerCase()}@novlearn.fr`,
      memberSince: "Novembre 2024",
      exercisesCompleted: 0,
      level: "Terminale",
    };
    setFriends([...friends, newFriend]);
    setFriendRequests(friendRequests.filter((r) => r.id !== request.id));
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
  };

  const fetchUserStats = useCallback(async () => {
    if (!user) {
      console.log('[AccountPage] fetchUserStats: No user, skipping');
      return;
    }

    console.log('[AccountPage] fetchUserStats: Starting for user', user.id);
    setLoading(true);
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Timeout de sécurité : si la requête prend plus de 10 secondes, on arrête le loading
      timeoutId = setTimeout(() => {
        console.error('[AccountPage] fetchUserStats: Timeout after 10s, setting loading to false');
        setLoading(false);
        setStats({ exercises_completed: 0, level: 'Terminale' });
      }, 10000);
      // Récupérer le nombre total d'exercices réalisés
      console.log('[AccountPage] fetchUserStats: Fetching exercise attempts...');
      const { data: attempts, error: attemptsError, count } = await supabase
        .from('exercise_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (attemptsError) {
        console.error('[AccountPage] fetchUserStats: Error fetching attempts:', attemptsError);
      } else {
        console.log('[AccountPage] fetchUserStats: Attempts count:', count);
      }

      // Récupérer la progression pour déterminer le niveau
      console.log('[AccountPage] fetchUserStats: Fetching user progress...');
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) {
        console.error('[AccountPage] fetchUserStats: Error fetching progress:', progressError);
      } else {
        console.log('[AccountPage] fetchUserStats: Progress data:', progress);
      }

      if (attemptsError || progressError) {
        console.error('[AccountPage] fetchUserStats: Errors occurred, using defaults');
        setStats({ exercises_completed: 0, level: 'Terminale' });
      } else {
        const exercisesCompleted = count || 0;
        console.log('[AccountPage] fetchUserStats: Setting stats - exercises:', exercisesCompleted);
        setStats({
          exercises_completed: exercisesCompleted,
          level: 'Terminale',
        });
      }
    } catch (error) {
      console.error('[AccountPage] fetchUserStats: Exception caught:', error);
      setStats({ exercises_completed: 0, level: 'Terminale' });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log('[AccountPage] fetchUserStats: Finished, setting loading to false');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('[AccountPage] useEffect: authLoading=', authLoading, 'user=', !!user, 'profile=', !!profile);
    
    if (!authLoading && !user) {
      console.log('[AccountPage] useEffect: No user, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (user && profile) {
      console.log('[AccountPage] useEffect: User and profile found, fetching stats');
      fetchUserStats();
    } else {
      console.log('[AccountPage] useEffect: Waiting for user/profile - user:', !!user, 'profile:', !!profile);
    }
  }, [user, profile, authLoading, router, fetchUserStats]);

  console.log('[AccountPage] Render: authLoading=', authLoading, 'loading=', loading, 'user=', !!user, 'profile=', !!profile);

  if (authLoading || loading) {
    console.log('[AccountPage] Render: Showing loading spinner');
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('[AccountPage] Render: No user or profile, returning null');
    return null;
  }

  console.log('[AccountPage] Render: Rendering account page content');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (selectedFriend) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <button
            onClick={() => setSelectedFriend(null)}
            className="bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            <span className="text-white">← Retour</span>
          </button>

          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Profil de {selectedFriend.name}
            </h2>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                <User className="w-16 h-16 text-white" />
              </div>
              <h3
                className="text-white text-3xl"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                {selectedFriend.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
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
                  {selectedFriend.memberSince}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
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
                  {selectedFriend.exercisesCompleted}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
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
                  {selectedFriend.level}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Onglets */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-2xl transition-all ${
              activeTab === "profile"
                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg"
                : "bg-slate-700/50 hover:bg-slate-600/60 text-blue-200"
            }`}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mon profil
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-6 py-3 rounded-2xl transition-all relative ${
              activeTab === "friends"
                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg"
                : "bg-slate-700/50 hover:bg-slate-600/60 text-blue-200"
            }`}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mes amis
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenu de l'onglet Profil */}
        {activeTab === "profile" && (
          <>
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
              {profile.first_name && profile.last_name
                ? `${profile.first_name.toUpperCase()} ${profile.last_name.toUpperCase()}`
                : profile.first_name.toUpperCase() || 'UTILISATEUR'}
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
          </>
        )}

        {/* Contenu de l'onglet Mes amis */}
        {activeTab === "friends" && (
          <>
            {/* Demandes d'amis en attente */}
            {friendRequests.length > 0 && (
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <h3
                  className="text-white text-xl mb-4"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  Demandes d'amis ({friendRequests.length})
                </h3>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <span
                          className="text-white"
                          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                        >
                          {request.from}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request)}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all"
                          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleDeclineFriendRequest(request.id)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des amis */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Amis ({friends.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-800/60 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p
                        className="text-white"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                      >
                        {friend.name}
                      </p>
                      <p
                        className="text-blue-200 text-sm"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
                      >
                        {friend.exercisesCompleted} exercices
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

