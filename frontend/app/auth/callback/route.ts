import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ⚠️ INDISPENSABLE : Force cette route à ne jamais être mise en cache
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log('🚀 [Callback Debug] Hit /auth/callback');
  console.log('   Full URL:', request.url);
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  
  // Log des headers critiques pour comprendre le proxy
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');
  
  console.log('   Headers Debug:', {
    'x-forwarded-host': forwardedHost,
    'x-forwarded-proto': forwardedProto,
    'host': host,
    'origin (from url)': origin
  });

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirection propre vers la page demandée
      // On s'assure que "next" commence bien par un slash
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
      const isLocal = origin.includes('localhost');
      
      console.log('   Decision Debug:', { isLocal, forwardedHost, forwardedProto });

      if (isLocal) {
        console.log('   👉 Redirecting to Local:', `${origin}${next}`);
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
         // Production avec proxy (Apache/Nginx)
         const target = `${forwardedProto}://${forwardedHost}${next}`;
         console.log('   👉 Redirecting to Prod (Proxy):', target);
         return NextResponse.redirect(target);
      } else {
         // Production directe
         console.log('   👉 Redirecting to Prod (Direct):', `${origin}${next}`);
         return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Erreur : on renvoie vers le login avec un message
  return NextResponse.redirect(`${origin}/auth/login?error=auth-code-error`);
}
