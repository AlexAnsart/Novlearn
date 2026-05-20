import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crée un client Supabase pour les Server Components.
 * À utiliser dans les pages/layouts/routes qui tournent côté serveur.
 *
 * Avantages :
 * - Les données sont chargées côté serveur (SSR)
 * - Pas de "flash" de contenu pendant le chargement client
 * - Meilleur SEO
 * - Moins de JavaScript envoyé au client
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // La méthode `setAll` est appelée depuis un Server Component.
            // Cela peut être ignoré si vous avez un middleware qui rafraîchit les sessions.
          }
        },
      },
    },
  );
}

/**
 * Récupère l'utilisateur connecté côté serveur.
 * Retourne null si non connecté.
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Récupère le profil de l'utilisateur connecté côté serveur.
 */
export async function getServerProfile() {
  const supabase = await createSupabaseServerClient();
  const user = await getServerUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Interface pour les entrées du classement hebdomadaire (score / streak)
 */
export interface LeaderboardEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  score: number;
  best_streak: number;
  rank: number;
  crown_count: number;
  star_count: number;
}

/**
 * Interface pour les entrées du classement taux de réussite (all-time)
 */
export interface SuccessRateEntry {
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

/**
 * Récupère les données du classement hebdomadaire côté serveur.
 * Permet un rendu initial plus rapide (SSR).
 */
export async function getLeaderboardData(
  sortBy: "score" | "streak" = "score",
  limit: number = 50,
): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  // Début de la semaine en cours (lundi 00:00 UTC, ISO 8601)
  const dayOfWeek = now.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const firstDayOfWeek = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday,
    ),
  ).toISOString();

  const { data, error } = await supabase.rpc("get_weekly_leaderboard", {
    week_start: firstDayOfWeek,
    result_limit: limit,
    sort_by: sortBy,
  });

  if (error) {
    console.error("[Server] Erreur leaderboard:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupère le classement taux de réussite de la semaine en cours (min 10 exercices).
 */
export async function getSuccessRateLeaderboard(
  minAttempts: number = 10,
  limit: number = 20,
): Promise<SuccessRateEntry[]> {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const firstDayOfWeek = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday,
    ),
  ).toISOString();

  const { data, error } = await supabase.rpc("get_success_rate_leaderboard", {
    week_start: firstDayOfWeek,
    min_attempts: minAttempts,
    result_limit: limit,
  });

  if (error) {
    console.error("[Server] Erreur success rate leaderboard:", error);
    return [];
  }

  return data || [];
}

/**
 * Attribue les récompenses de la semaine précédente si ce n'est pas encore fait.
 * Appelé au chargement de la page classement (SSR). Utilise la service role key.
 * La fonction SQL est idempotente (ON CONFLICT DO UPDATE).
 */
export async function maybeAwardLastWeek(): Promise<void> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return;

  // Lundi 00:00 UTC de la semaine précédente
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const prevWeekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday - 7,
    ),
  );
  const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Guard : si les récompenses de cette semaine existent déjà, on ne refait rien
  const { count } = await admin
    .from("user_weekly_rewards")
    .select("id", { count: "exact", head: true })
    .eq("week_start", prevWeekStartStr);

  if (count && count > 0) return;

  await admin.rpc("award_weekly_top3");
}
