import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. On prépare la réponse
  // (C'est nécessaire pour pouvoir y attacher les cookies Supabase)
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. On initialise Supabase pour rafraîchir la session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 3. On rafraîchit la session utilisateur
  // C'est cette ligne qui permet de valider le lien magique email !
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // --- LOGIQUE DE PROTECTION DES ROUTES ---

  // A. Routes toujours publiques (Auth)
  const isAuthRoute = path.startsWith("/auth");
  const isCallback = path.startsWith("/auth/callback");
  const isUpdatePassword = path.startsWith("/auth/update-password");

  // B. Si l'utilisateur est connecté et essaie d'aller sur Login/Signup, on le renvoie à l'accueil
  // SAUF si c'est update-password (car on peut vouloir changer son mdp en étant connecté)
  if (user && isAuthRoute && !isUpdatePassword && !isCallback) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // C. Cas Spécial "Mot de passe oublié" :
  // La page /auth/update-password nécessite impérativement d'être connecté.
  // (L'utilisateur EST connecté grâce au lien email cliqué juste avant).
  if (isUpdatePassword && !user) {
    // Si pas connecté, on renvoie au login car il n'a rien à faire là
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // D. Protection des routes privées (Exemple)
  // Ajoutez ici les dossiers qui nécessitent une connexion
  // Exemple : si le path commence par /compte ou /dashboard
  // const isProtectedRoute = path.startsWith('/compte') || path.startsWith('/parametres');
  // if (isProtectedRoute && !user) {
  //   url.pathname = '/auth/login';
  //   return NextResponse.redirect(url);
  // }

  // Si tout est bon, on laisse passer avec les cookies mis à jour
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
