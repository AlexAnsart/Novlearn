"use client";

import {
  Award,
  Calendar,
  Check,
  Copy,
  Crown,
  Flame,
  LogOut,
  Mail,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { friendsApi } from "../lib/api";
import { supabase } from "../lib/supabase";

interface Friend {
  id: string;
  name: string;
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
  total_answers: number;
  correct_answers: number;
  correct_rate_pct: number;
  level: string;
  best_streak: number;
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
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [friendCodeError, setFriendCodeError] = useState<string | null>(null);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendRequestsError, setFriendRequestsError] = useState<string | null>(
    null,
  );
  const [friendCodeLoading, setFriendCodeLoading] = useState(false);

  // --- ÉTATS POUR LA SUPPRESSION DE COMPTE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs pour gérer le montage et l'annulation des requêtes
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    try {
      await friendsApi.acceptFriendRequest(request.id);
      await loadFriends();
      setFriendRequests(friendRequests.filter((r) => r.id !== request.id));
      toast.success("Demande d'ami acceptée !");
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      toast.error(
        error.message || "Erreur lors de l'acceptation de la demande",
      );
    }
  };

  const handleDeclineFriendRequest = async (requestId: number) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
      toast.success("Demande refusée.");
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      toast.error(error.message || "Erreur lors du refus de la demande");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (removingFriendId) return;
    setRemovingFriendId(friendId);
    try {
      await friendsApi.removeFriend(friendId);
      await loadFriends();
      if (selectedFriend?.id === friendId) setSelectedFriend(null);
    } catch (error: any) {
      console.error("Error removing friend:", error);
      alert(error.message || "Erreur lors de la suppression de l'ami");
    } finally {
      setRemovingFriendId(null);
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      console.log("Lancement de la suppression définitive du compte...");

      // 1. Récupérer la session actuelle pour avoir le token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Session introuvable. Veuillez vous reconnecter.");
      }

      // 2. Appeler notre route API sécurisée pour supprimer le compte
      const response = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`, // On envoie le token pour prouver qu'on est bien nous
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // 3. Si l'API a réussi, on déconnecte le client localement pour nettoyer le stockage
      await signOut();

      // 4. Redirection vers l'accueil
      router.push("/");
    } catch (error: any) {
      console.error("Erreur suppression compte:", error);
      toast.error(`Impossible de supprimer le compte : ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const loadFriends = useCallback(async () => {
    if (!isMountedRef.current) return;

    setFriendsError(null);
    try {
      const { friends: friendsData } = await friendsApi.getFriends();

      if (!isMountedRef.current) return;

      setFriends(
        friendsData.map((f) => ({
          id: f.id,
          name: f.name,
          // `created_at` vient du backend (pas de mock).
          memberSince: f.created_at ?? "",
          exercisesCompleted: f.exercises_completed ?? 0,
          level: "Terminale",
        })),
      );
      setFriendsError(null);
    } catch (error: any) {
      if (!isMountedRef.current) return;

      const errorMessage = error?.message || String(error);
      console.error("[AccountPage] loadFriends error:", errorMessage);
      setFriendsError(
        errorMessage.includes("fetch") ||
          errorMessage.includes("Failed to fetch")
          ? "Backend non disponible"
          : errorMessage,
      );
      setFriends([]);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    if (!isMountedRef.current) return;

    setFriendRequestsError(null);
    try {
      const { requests } = await friendsApi.getFriendRequests();

      if (!isMountedRef.current) return;

      setFriendRequests(
        requests.map((r) => ({
          id: r.id,
          from: r.from_user_name,
          fromId: r.from_user_id,
        })),
      );
      setFriendRequestsError(null);
    } catch (error: any) {
      if (!isMountedRef.current) return;

      const errorMessage = error?.message || String(error);
      console.error("[AccountPage] loadFriendRequests error:", errorMessage);
      setFriendRequestsError(
        errorMessage.includes("fetch") ||
          errorMessage.includes("Failed to fetch")
          ? "Backend non disponible"
          : errorMessage,
      );
      setFriendRequests([]);
    }
  }, []);

  const loadFriendCode = useCallback(async () => {
    if (!isMountedRef.current) return;
    setFriendCodeError(null);
    setFriendCodeLoading(true);

    try {
      const result = await friendsApi.getFriendCode();
      if (!isMountedRef.current) return;
      setFriendCode(result.code);
      setInviteLink(result.invite_link);
      setFriendCodeError(null);
      setFriendCodeLoading(false);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      const errorMessage = error?.message || String(error);
      const displayError = errorMessage.includes("fetch")
        ? "Backend non disponible."
        : errorMessage;
      setFriendCodeError(displayError);
      setFriendCode(null);
      setInviteLink(null);
      setFriendCodeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const handleCopyFriendCode = () => {
    if (friendCode) {
      navigator.clipboard.writeText(friendCode);
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
      toast.success("Demande d'ami envoyée !");
    } catch (error: any) {
      console.error("Error adding friend:", error);
      toast.error(error.message || "Erreur lors de l'ajout de l'ami");
    } finally {
      setAddingFriend(false);
    }
  };

  const fetchUserStats = useCallback(async () => {
    if (!isMountedRef.current || !user) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (isMountedRef.current) {
      setLoading(true);
    }

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      timeoutId = setTimeout(() => {
        if (abortController.signal.aborted || !isMountedRef.current) return;
        if (isMountedRef.current) {
          setLoading(false);
          setStats({
            exercises_completed: 0,
            total_answers: 0,
            correct_answers: 0,
            correct_rate_pct: 0,
            level: "Terminale",
            best_streak: 0,
          });
        }
      }, 15000);

      if (abortController.signal.aborted || !isMountedRef.current) return;

      if (abortController.signal.aborted || !isMountedRef.current) return;

      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exercise_attempts")
        .select("exercise_id, is_correct")
        .eq("user_id", user.id);

      if (abortController.signal.aborted || !isMountedRef.current) return;

      const bestStreak = profile?.max_streak ?? 0;

      if (attemptsError || !attemptsData) {
        setStats({
          exercises_completed: 0,
          total_answers: 0,
          correct_answers: 0,
          correct_rate_pct: 0,
          level: "Terminale",
          best_streak: bestStreak,
        });
      } else {
        const totalAnswers = attemptsData.length;
        const correctAnswers = attemptsData.filter((a) => a.is_correct).length;
        const distinctExercises = new Set(
          attemptsData.map((a) => a.exercise_id).filter(Boolean),
        ).size;
        const correctRatePct =
          totalAnswers > 0
            ? Math.round((correctAnswers / totalAnswers) * 100)
            : 0;
        setStats({
          exercises_completed: distinctExercises,
          total_answers: totalAnswers,
          correct_answers: correctAnswers,
          correct_rate_pct: correctRatePct,
          level: "Terminale",
          best_streak: bestStreak,
        });
      }
    } catch (error) {
      if (abortController.signal.aborted || !isMountedRef.current) return;
      if (isMountedRef.current) {
        setStats({
          exercises_completed: 0,
          total_answers: 0,
          correct_answers: 0,
          correct_rate_pct: 0,
          level: "Terminale",
          best_streak: 0,
        });
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      if (profile) {
        fetchUserStats();
      } else {
        const profileTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            fetchUserStats();
          }
        }, 3000);
        return () => clearTimeout(profileTimeout);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, profile, authLoading, router, fetchUserStats]);

  useEffect(() => {
    if (user && activeTab === "friends" && isMountedRef.current) {
      loadFriends();
      loadFriendRequests();
      loadFriendCode();
    }
  }, [user, activeTab, loadFriends, loadFriendRequests, loadFriendCode]);

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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
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
                  {formatDate(selectedFriend.memberSince)}
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
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => handleRemoveFriend(selectedFriend.id)}
                disabled={removingFriendId === selectedFriend.id}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 transition-all disabled:opacity-50"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                {removingFriendId === selectedFriend.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Remove friend
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8 relative">
      {/* --- MODALE DE CONFIRMATION DE SUPPRESSION --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3
                className="text-white text-2xl font-bold mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Supprimer votre compte ?
              </h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Êtes-vous sûr de vouloir faire ça ? <br />
                <span className="text-red-400 font-semibold">
                  Cette action est irréversible.
                </span>{" "}
                <br />
                Toutes vos données (progression, amis, statistiques) seront
                définitivement effacées.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Oui, supprimer définitivement
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    : profile?.first_name?.toUpperCase() ||
                      user?.email?.split("@")[0]?.toUpperCase() ||
                      "UTILISATEUR"}
                </h3>
                {/* Badges de récompenses sous le nom */}
                {profile &&
                  (profile.crown_count > 0 || profile.star_count > 0) && (
                    <div className="flex items-center gap-2 mt-2">
                      {profile.crown_count > 0 && (
                        <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/40 rounded-full px-2.5 py-1">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span
                            className="text-yellow-200 text-sm font-bold"
                            style={{ fontFamily: "'Fredoka', sans-serif" }}
                          >
                            {profile.crown_count}
                          </span>
                        </span>
                      )}
                      {profile.star_count > 0 && (
                        <span className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-400/40 rounded-full px-2.5 py-1">
                          <Star className="w-4 h-4 text-indigo-300" />
                          <span
                            className="text-indigo-200 text-sm font-bold"
                            style={{ fontFamily: "'Fredoka', sans-serif" }}
                          >
                            {profile.star_count}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
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
                    {profile?.created_at
                      ? formatDate(profile.created_at)
                      : "N/A"}
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
                    {stats?.exercises_completed ?? 0}
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
                      Taux de réussite
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
                    {stats?.correct_rate_pct ?? 0}%
                  </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-orange-400" />
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
                    {stats?.level ?? "Terminale"}
                  </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <span
                      className="text-blue-200"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Meilleure streak
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
                    {stats?.best_streak ?? 0}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => router.push("/progression")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-700/50 hover:bg-slate-600/60 text-blue-200 transition-all"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  <TrendingUp className="w-5 h-5" />
                  Voir ma progression
                </button>
              </div>
            </div>

            {/* Bouton de déconnexion */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleSignOut}
                className="bg-slate-700/80 hover:bg-slate-600 backdrop-blur-sm rounded-2xl px-8 py-4 transition-all shadow-lg flex items-center gap-3"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                <LogOut className="w-5 h-5 text-white" />
                <span className="text-white text-lg">Se déconnecter</span>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-700/50">
              <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-red-200 font-semibold text-lg">
                    Supprimer mon compte
                  </p>
                  <p className="text-red-300/60 text-sm max-w-md">
                    Attention, cette action est irréversible. Toutes vos données
                    seront définitivement effacées.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 border border-red-500/30 hover:border-red-500/50 whitespace-nowrap"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  <Trash2 className="w-5 h-5" />
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </>
        )}

        {/* Contenu de l'onglet Mes amis */}
        {activeTab === "friends" && (
          <>
            {/* Mon code d'ami */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Mon code d'ami
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-900/40 rounded-xl p-3 md:p-4 min-w-0">
                  <p
                    className="text-blue-200 text-sm mb-1 truncate"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    Code :
                  </p>
                  {(() => {
                    if (friendCodeError) {
                      return (
                        <p className="text-red-400 text-sm truncate">
                          {friendCodeError}
                        </p>
                      );
                    }
                    if (friendCodeLoading || !friendCode) {
                      return (
                        <p className="text-white text-xl md:text-2xl font-bold">
                          ...
                        </p>
                      );
                    }
                    return (
                      <p
                        className="text-white text-xl md:text-2xl font-bold truncate"
                        style={{ fontFamily: "'Fredoka', sans-serif" }}
                      >
                        {friendCode}
                      </p>
                    );
                  })()}
                </div>

                {/* BOUTON COPIER RESPONSIVE */}
                <button
                  onClick={handleCopyFriendCode}
                  disabled={!friendCode}
                  // Mobile : p-4 (carré). Desktop (md) : px-6 py-4 (rectangle)
                  className="p-4 md:px-6 md:py-4 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  {copied ? (
                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <Copy className="w-5 h-5 md:w-6 md:h-6" />
                  )}

                  {/* TEXTE : Caché sur mobile (hidden), Visible sur PC (md:block) */}
                  <span
                    className="hidden md:block"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {copied ? "Copié !" : "Copier le code"}
                  </span>
                </button>
              </div>
            </div>

            {/* Ajouter un ami */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Ajouter un ami
              </h3>
              <div className="flex items-center gap-2 md:gap-3">
                <input
                  type="text"
                  value={addFriendCode}
                  onChange={(e) => setAddFriendCode(e.target.value)}
                  // Placeholder court sur mobile, plus long sur desktop
                  placeholder="Code d'ami"
                  className="flex-1 px-3 py-3 md:px-4 rounded-xl bg-slate-900/40 text-white border-2 border-slate-700 focus:border-blue-500 outline-none min-w-0"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                />

                {/* BOUTON AJOUTER RESPONSIVE */}
                <button
                  onClick={handleAddFriend}
                  disabled={addingFriend || !addFriendCode.trim()}
                  // Mobile : px-4 (étroit). Desktop (md) : px-6 (plus large)
                  className="px-4 py-3 md:px-6 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white transition-all hover:scale-105 disabled:opacity-50 shrink-0"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {/* Texte s'adapte ou reste court */}
                  {addingFriend ? "..." : "Ajouter"}
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
                    <p
                      className="text-red-400 text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      {friendRequestsError}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleAcceptFriendRequest(request)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all text-sm sm:text-base"
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleDeclineFriendRequest(request.id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-sm sm:text-base"
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          <X className="w-4 h-4" />
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
                  <p
                    className="text-red-400 text-sm"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {friendsError}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/60 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-white truncate"
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend.id);
                      }}
                      disabled={removingFriendId === friend.id}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 shrink-0"
                      title="Remove friend"
                      aria-label={`Remove ${friend.name} from friends`}
                    >
                      {removingFriendId === friend.id ? (
                        <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
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
