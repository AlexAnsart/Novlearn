import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// --- VOTRE LOGIQUE DE VÉRIFICATION (Très utile !) ---
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[Supabase] ERROR: Supabase URL or Anon Key is missing!");
  console.error("[Supabase] URL:", supabaseUrl ? "present" : "MISSING");
  console.error("[Supabase] Key:", supabaseAnonKey ? "present" : "MISSING");
  console.error("[Supabase] Please check your environment variables.");
} else {
  // Optionnel : décommentez si vous voulez voir ça à chaque chargement
  // console.log('[Supabase] Initialized successfully');
}

// --- LA NOUVELLE INITIALISATION (Pour Next.js App Router) ---
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
