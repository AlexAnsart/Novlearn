import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Routes publiques (pas besoin d'authentification)
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/verify-email'];
  const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

  // Si la route est publique, on laisse passer
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Pour les routes protégées, on laisse le client gérer la redirection
  // Le middleware Next.js ne peut pas facilement accéder aux cookies Supabase
  // La protection sera gérée côté client dans les composants
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

