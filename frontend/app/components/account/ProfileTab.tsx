"use client";

import {
  Award,
  Calendar,
  Crown,
  Flame,
  LogOut,
  Mail,
  Palette,
  Pencil,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ThemeToggle } from "../ThemeToggle";
import AvatarCustomizer from "./AvatarCustomizer";
import AvatarDisplay from "./AvatarDisplay";
import DeleteAccountModal from "./DeleteAccountModal";

interface UserStats {
  exercises_completed: number;
  total_answers: number;
  correct_answers: number;
  correct_rate_pct: number;
  level: string;
  best_streak: number;
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ProfileTab() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUserStats = useCallback(async () => {
    if (!isMountedRef.current || !user) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setLoading(true);

    const timeoutId = setTimeout(() => {
      if (!abortController.signal.aborted && isMountedRef.current) {
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

    try {
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
    } catch {
      if (!abortController.signal.aborted && isMountedRef.current) {
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
      clearTimeout(timeoutId);
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    isMountedRef.current = true;

    if (profile) {
      fetchUserStats();
    } else {
      const t = setTimeout(() => {
        if (isMountedRef.current) fetchUserStats();
      }, 3000);
      return () => clearTimeout(t);
    }

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [profile, fetchUserStats]);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session introuvable. Veuillez vous reconnecter.");

      const response = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      await signOut();
      router.push("/");
    } catch (error: any) {
      toast.error(`Impossible de supprimer le compte : ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.toUpperCase()} ${profile.last_name.toUpperCase()}`
      : profile?.first_name?.toUpperCase() ||
        user?.email?.split("@")[0]?.toUpperCase() ||
        "UTILISATEUR";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <>
      {showDeleteModal && (
        <DeleteAccountModal
          isDeleting={isDeleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showAvatarCustomizer && (
        <AvatarCustomizer onClose={() => setShowAvatarCustomizer(false)} />
      )}

      {/* Carte profil */}
      <div className="bg-app-surface/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-card border border-app-border/40">
        {/* Avatar et nom */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <AvatarDisplay
              avatarId={profile?.avatar_id}
              avatarColor={profile?.avatar_color}
              size="lg"
            />
            <button
              onClick={() => setShowAvatarCustomizer(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-app-accent hover:bg-app-accent/80 text-white flex items-center justify-center shadow-lg transition-colors"
              title="Modifier l'avatar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <h3
            className="text-content-strong text-3xl"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            {displayName}
          </h3>
          {profile && (profile.crown_count > 0 || profile.star_count > 0) && (
            <div className="flex items-center gap-2 mt-2">
              {profile.crown_count > 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/40 rounded-full px-2.5 py-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span
                    className="text-yellow-600 dark:text-yellow-200 text-sm font-bold"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {profile.crown_count}
                  </span>
                </span>
              )}
              {profile.star_count > 0 && (
                <span className="flex items-center gap-1 bg-app-accent/15 border border-app-accent/40 rounded-full px-2.5 py-1">
                  <Star className="w-4 h-4 text-app-accent" />
                  <span
                    className="text-app-accent text-sm font-bold"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {profile.star_count}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grille de stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard icon={<Mail className="w-5 h-5 text-app-primary" />} label="Email">
            {profile?.email || user?.email || "N/A"}
          </StatCard>

          <StatCard icon={<Calendar className="w-5 h-5 text-app-primary" />} label="Membre depuis">
            {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
          </StatCard>

          <StatCard icon={<Award className="w-5 h-5 text-app-primary" />} label="Exercices réalisés" large>
            {stats?.exercises_completed ?? 0}
          </StatCard>

          <StatCard icon={<Award className="w-5 h-5 text-yellow-500" />} label="Taux de réussite" large>
            {stats?.correct_rate_pct ?? 0}%
          </StatCard>

          <StatCard icon={<Award className="w-5 h-5 text-orange-500" />} label="Niveau" large>
            {stats?.level ?? "Terminale"}
          </StatCard>

          <StatCard icon={<Flame className="w-5 h-5 text-red-500" />} label="Meilleure streak" large>
            {stats?.best_streak ?? 0}
          </StatCard>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push("/progression")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-app-icon-bg/50 hover:bg-app-icon-bg-hover/70 text-app-primary transition-all"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            <TrendingUp className="w-5 h-5" />
            Voir ma progression
          </button>
        </div>
      </div>

      {/* Préférences : thème clair / sombre / système */}
      <div className="bg-app-surface/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-card-sm border border-app-border/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-app-primary/15 flex items-center justify-center">
              <Palette className="w-5 h-5 text-app-primary" />
            </div>
            <div>
              <p
                className="text-content-strong text-lg"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                Apparence
              </p>
              <p className="text-content-muted text-sm">
                Choisis le thème qui te convient le mieux.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Déconnexion */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleSignOut}
          className="bg-app-icon-bg/70 hover:bg-app-icon-bg-hover/80 backdrop-blur-sm rounded-2xl px-8 py-4 transition-all shadow-card-sm flex items-center gap-3"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          <LogOut className="w-5 h-5 text-content-strong" />
          <span className="text-content-strong text-lg">Se déconnecter</span>
        </button>
      </div>

      {/* Zone danger */}
      <div className="mt-8 pt-8 border-t border-app-border/60">
        <div className="bg-app-danger/10 border border-app-danger/40 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-app-danger font-semibold text-lg">
              Supprimer mon compte
            </p>
            <p className="text-app-danger/80 text-sm max-w-md">
              Attention, cette action est irréversible. Toutes vos données seront
              définitivement effacées.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-app-danger hover:text-white hover:bg-app-danger font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 border border-app-danger/50 whitespace-nowrap"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            <Trash2 className="w-5 h-5" />
            Supprimer mon compte
          </button>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  large,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-app-surface-sunken/70 backdrop-blur-sm rounded-2xl p-6 shadow-card-sm border border-app-border/30">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span
          className="text-app-primary"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-content-strong ml-8"
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 500,
          ...(large ? { fontSize: "1.5rem" } : {}),
        }}
      >
        {children}
      </p>
    </div>
  );
}
