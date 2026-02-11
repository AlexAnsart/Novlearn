import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La méthode `set` est appelée depuis un Server Component.
            // Cela peut être ignoré si vous avez un middleware qui rafraîchit les sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Idem que ci-dessus
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
 * Interface pour les entrées du classement
 */
export interface LeaderboardEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  score: number;
  best_streak: number;
  rank: number;
}

/**
 * Récupère les données du classement mensuel côté serveur.
 * Permet un rendu initial plus rapide (SSR).
 */
export async function getLeaderboardData(
  sortBy: "score" | "streak" = "score",
  limit: number = 50,
): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const firstDayOfMonth = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), 1),
  ).toISOString();

  const { data, error } = await supabase.rpc("get_monthly_leaderboard", {
    month_start: firstDayOfMonth,
    result_limit: limit,
    sort_by: sortBy,
  });

  if (error) {
    console.error("[Server] Erreur leaderboard:", error);
    return [];
  }

  return data || [];
}
