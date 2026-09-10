import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ⚠️ INDISPENSABLE : Force cette route à ne jamais être mise en cache
export const dynamic = "force-dynamic";

// Un en-tête `X-Forwarded-*` peut contenir PLUSIEURS valeurs séparées par des
// virgules (mod_proxy ajoute la sienne à celle posée par `RequestHeader set`,
// d'où un `novlearn.fr, novlearn.fr` en production). On ne garde que la première.
function firstHeaderValue(value: string | null): string {
  return value?.split(",")[0]?.trim() ?? "";
}

// Empêche une redirection ouverte : on n'accepte qu'un chemin interne.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // IMPORTANT (reverse proxy):
  // When Apache proxies to the Next server, `request.url` may be based on the internal
  // upstream (e.g. http://localhost:3001). We must reconstruct the *public* origin
  // from forwarded headers / Host header.
  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ||
    url.protocol.replace(":", "");
  const forwardedHost =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ||
    firstHeaderValue(request.headers.get("host"));

  // On valide l'origine reconstruite : si elle est invalide, on retombe sur
  // celle de la requête plutôt que de laisser `NextResponse.redirect` lever.
  let siteUrl = url.origin;
  if (forwardedHost) {
    try {
      siteUrl = new URL(`${forwardedProto}://${forwardedHost}`).origin;
    } catch {
      console.error(
        "[auth/callback] origine invalide, fallback sur url.origin:",
        forwardedProto,
        forwardedHost,
      );
    }
  }

  if (code) {
    try {
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
        return NextResponse.redirect(`${siteUrl}${next}`);
      }
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    } catch (err) {
      console.error("[auth/callback] exchangeCodeForSession threw:", err);
    }
  }

  // Erreur : on renvoie vers le login avec un message
  return NextResponse.redirect(`${siteUrl}/auth/login?error=auth-code-error`);
}
