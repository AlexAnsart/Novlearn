import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ⚠️ INDISPENSABLE : Force cette route à ne jamais être mise en cache
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Utilisation de la variable d'environnement garantie par le deploy.yml
  // Si elle n'existe pas (sur ton PC), on garde l'origin (http://localhost:3000)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
              // Ignorer si appelé depuis un Server Component
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ✅ Redirection 100% fiable
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // Erreur : on renvoie vers le login avec un message
  return NextResponse.redirect(`${siteUrl}/auth/login?error=auth-code-error`);
}
