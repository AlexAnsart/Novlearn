import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ⚠️ INDISPENSABLE : Force cette route à ne jamais être mise en cache
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // IMPORTANT (reverse proxy):
  // When Apache proxies to the Next server, `request.url` may be based on the internal
  // upstream (e.g. http://localhost:3001). We must reconstruct the *public* origin
  // from forwarded headers / Host header.
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    request.headers.get("X-Forwarded-Proto") ||
    url.protocol.replace(":", "");
  const forwardedHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("X-Forwarded-Host") ||
    request.headers.get("host") ||
    "";
  const siteUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;

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
