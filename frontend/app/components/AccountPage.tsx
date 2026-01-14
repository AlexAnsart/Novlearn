"use client";

import { Award, Calendar, LogOut, Mail, User, Users, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { friendsApi, Friend as ApiFriend, FriendRequest as ApiFriendRequest } from "../lib/api";

interface Friend {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  exercisesCompleted: number;
  level: string;
}

interface FriendRequest {
  id: number;
  from: string;
  fromId: string;
}

interface UserStats {
  exercises_completed: number;
  level: string;
}

export function AccountPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [addFriendCode, setAddFriendCode] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendCodeError, setFriendCodeError] = useState<string | null>(null);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendRequestsError, setFriendRequestsError] = useState<string | null>(null);
  const [friendCodeLoading, setFriendCodeLoading] = useState(false);
  
  // Refs pour gérer le montage et l'annulation des requêtes
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    try {
      await friendsApi.acceptFriendRequest(request.id);
      // Refresh friends list
      await loadFriends();
      // Remove from pending
      setFriendRequests(friendRequests.filter((r) => r.id !== request.id));
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      alert(error.message || "Erreur lors de l'acceptation de la demande");
    }
  };

  const handleDeclineFriendRequest = async (requestId: number) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      alert(error.message || "Erreur lors du refus de la demande");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const loadFriends = useCallback(async () => {
    if (!isMountedRef.current) return;

    setFriendsError(null);
    try {
      const { friends: friendsData } = await friendsApi.getFriends();
      
      if (!isMountedRef.current) return;
      
      setFriends(friendsData.map(f => ({
        id: f.id,
        name: f.name,
        email: f.email,
        memberSince: "2024",
        exercisesCompleted: 0,
        level: "Terminale"
      })));
      setFriendsError(null);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error?.message || String(error);
      console.error('[AccountPage] loadFriends error:', errorMessage);
      setFriendsError(errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch")
        ? "Backend non disponible"
        : errorMessage);
      setFriends([]);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    if (!isMountedRef.current) return;

    setFriendRequestsError(null);
    try {
      const { requests } = await friendsApi.getFriendRequests();
      
      if (!isMountedRef.current) return;
      
      setFriendRequests(requests.map(r => ({
        id: r.id,
        from: r.from_user_name,
        fromId: r.from_user_id
      })));
      setFriendRequestsError(null);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error?.message || String(error);
      console.error('[AccountPage] loadFriendRequests error:', errorMessage);
      setFriendRequestsError(errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch")
        ? "Backend non disponible"
        : errorMessage);
      setFriendRequests([]);
    }
  }, []);

  const loadFriendCode = useCallback(async () => {
    if (!isMountedRef.current) return;

    setFriendCodeError(null);
    setFriendCodeLoading(true);
    try {
      const { code, invite_link } = await friendsApi.getFriendCode();
      
      if (!isMountedRef.current) return;
      
      setFriendCode(code);
      setInviteLink(invite_link);
      setFriendCodeError(null);
      setFriendCodeLoading(false);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error?.message || String(error);
      console.error('[AccountPage] loadFriendCode error:', errorMessage);
      
      setFriendCodeError(errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch") || errorMessage.includes("timeout") || errorMessage.includes("Request timeout")
        ? "Backend non disponible. Assurez-vous que le serveur backend est lancé sur http://localhost:8010"
        : errorMessage);
      setFriendCode(null);
      setInviteLink(null);
      setFriendCodeLoading(false);
    }
  }, []);

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddFriend = async () => {
    if (!addFriendCode.trim()) return;
    
    setAddingFriend(true);
    try {
      await friendsApi.addFriendByCode(addFriendCode.trim());
      setAddFriendCode("");
      alert("Demande d'ami envoyée !");
    } catch (error: any) {
      console.error("Error adding friend:", error);
      alert(error.message || "Erreur lors de l'ajout de l'ami");
    } finally {
      setAddingFriend(false);
    }
  };

  const fetchUserStats = useCallback(async () => {
    if (!isMountedRef.current || !user) return;

    // Créer un AbortController pour cette requête
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    if (isMountedRef.current) {
      setLoading(true);
    }

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Timeout de sécurité : si la requête prend plus de 15 secondes, on arrête le loading
      timeoutId = setTimeout(() => {
        if (abortController.signal.aborted || !isMountedRef.current) return;
        
        console.warn('[AccountPage] fetchUserStats TIMEOUT after 15s');
        if (isMountedRef.current) {
          setLoading(false);
          setStats({ exercises_completed: 0, level: "Terminale" });
        }
      }, 15000);

      // Vérifier si annulé avant de commencer les requêtes
      if (abortController.signal.aborted || !isMountedRef.current) return;

      // Récupérer le nombre total d'exercices réalisés
      const {
        data: attempts,
        error: attemptsError,
        count,
      } = await supabase
        .from("exercise_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Vérifier si annulé après la première requête
      if (abortController.signal.aborted || !isMountedRef.current) return;
      
      if (attemptsError) {
        console.error('[AccountPage] Error fetching attempts:', attemptsError.message);
      }

      // Récupérer la progression pour déterminer le niveau
      const { data: progress, error: progressError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      // Vérifier si annulé après la deuxième requête
      if (abortController.signal.aborted || !isMountedRef.current) return;

      if (progressError) {
        console.error('[AccountPage] Error fetching progress:', progressError.message);
      }

      // Vérifier une dernière fois avant de mettre à jour l'état
      if (abortController.signal.aborted || !isMountedRef.current) return;

      if (attemptsError || progressError) {
        setStats({ exercises_completed: 0, level: "Terminale" });
      } else {
        const exercisesCompleted = count || 0;
        setStats({
          exercises_completed: exercisesCompleted,
          level: "Terminale",
        });
      }
    } catch (error) {
      // Ignorer les erreurs si la requête a été annulée
      if (abortController.signal.aborted || !isMountedRef.current) return;

      console.error('[AccountPage] fetchUserStats exception:', error);
      if (isMountedRef.current) {
        setStats({ exercises_completed: 0, level: "Terminale" });
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    // If we have a user, proceed even if profile is not loaded yet
    if (user) {
      if (profile) {
        fetchUserStats();
      } else {
        // Wait a bit for profile to load, but don't wait forever
        const profileTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            fetchUserStats();
          }
        }, 3000);

        return () => {
          clearTimeout(profileTimeout);
        };
      }
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Annuler les requêtes en cours
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, profile, authLoading, router, fetchUserStats]);

  // Load friends data
  useEffect(() => {
    if (user && activeTab === "friends" && isMountedRef.current) {
      loadFriends();
      loadFriendRequests();
      loadFriendCode();
    }

    // Cleanup function
    return () => {
      // Les requêtes sont déjà gérées par isMountedRef dans les fonctions
      // Pas besoin d'annuler ici car elles vérifient isMountedRef avant de mettre à jour l'état
    };
  }, [user, activeTab, loadFriends, loadFriendRequests, loadFriendCode]);

  // Removed verbose render logging - only log errors now

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
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
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Membre depuis
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {selectedFriend.memberSince}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span
                    className="text-blue-200"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Exercices réalisés
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 500,
                    fontSize: "1.5rem",
                  }}
                >
                  {selectedFriend.exercisesCompleted}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span
                    className="text-blue-200"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Niveau
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 500,
                    fontSize: "1.5rem",
                  }}
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
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name.toUpperCase()} ${profile.last_name.toUpperCase()}`
                    : profile?.first_name?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase() || "UTILISATEUR"}
                </h3>
              </div>

              {/* Informations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span
                      className="text-blue-200"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Email
                    </span>
                  </div>
                  <p
                    className="text-white ml-8"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {profile?.email || user?.email || "N/A"}
                  </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span
                      className="text-blue-200"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Membre depuis
                    </span>
                  </div>
                  <p
                    className="text-white ml-8"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
                  </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span
                      className="text-blue-200"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Exercices réalisés
                    </span>
                  </div>
                  <p
                    className="text-white ml-8"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 500,
                      fontSize: "1.5rem",
                    }}
                  >
                    {stats?.exercises_completed || 0}
                  </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span
                      className="text-blue-200"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Niveau
                    </span>
                  </div>
                  <p
                    className="text-white ml-8"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 500,
                      fontSize: "1.5rem",
                    }}
                  >
                    {stats?.level || "Terminale"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton de déconnexion */}
            <div className="flex justify-center">
              <button
                onClick={handleSignOut}
                className="bg-red-600/80 hover:bg-red-700 backdrop-blur-sm rounded-2xl px-8 py-4 transition-all shadow-[0_4px_16px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] flex items-center gap-3"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                <LogOut className="w-5 h-5 text-white" />
                <span className="text-white text-lg">Se déconnecter</span>
              </button>
            </div>
          </>
        )}

        {/* Contenu de l'onglet Mes amis */}
        {activeTab === "friends" && (
          <>
            {/* Mon code d'ami */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Mon code d'ami
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-900/40 rounded-xl p-4">
                  <p className="text-blue-200 text-sm mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                    Code :
                  </p>
                  {friendCodeError ? (
                    <p className="text-red-400 text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                      {friendCodeError}
                    </p>
                  ) : friendCodeLoading || !friendCode ? (
                    <p className="text-white text-2xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                      Chargement...
                    </p>
                  ) : (
                    <p className="text-white text-2xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                      {friendCode}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCopyInviteLink}
                  disabled={!inviteLink}
                  className="px-6 py-4 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copié !" : "Copier le lien"}
                </button>
              </div>
            </div>

            {/* Ajouter un ami */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Ajouter un ami
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={addFriendCode}
                  onChange={(e) => setAddFriendCode(e.target.value)}
                  placeholder="Entrez le code d'ami"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900/40 text-white border-2 border-slate-700 focus:border-blue-500 outline-none"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                />
                <button
                  onClick={handleAddFriend}
                  disabled={addingFriend || !addFriendCode.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  {addingFriend ? "Envoi..." : "Ajouter"}
                </button>
              </div>
            </div>

            {/* Demandes d'amis en attente */}
            {(friendRequests.length > 0 || friendRequestsError) && (
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <h3
                  className="text-white text-xl mb-4"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Demandes d'amis ({friendRequests.length})
                </h3>
                {friendRequestsError && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                    <p className="text-red-400 text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                      {friendRequestsError}
                    </p>
                  </div>
                )}
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
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          {request.from}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request)}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all"
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleDeclineFriendRequest(request.id)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                          }}
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
              {friendsError && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-400 text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                    {friendsError}
                  </p>
                </div>
              )}
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
                        style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {friend.name}
                      </p>
                      <p
                        className="text-blue-200 text-sm"
                        style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontWeight: 400,
                        }}
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
