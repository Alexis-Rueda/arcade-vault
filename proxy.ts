import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

// Check optimista: lee cookies de Supabase sin round-trip
function isAuthenticated(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'));
}

// Rutas que requieren sesión activa: /games/[id] y /games/[id]/play
const PROTECTED_ROUTES = /^\/games\/[^/]+(?:\/play)?$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger /games/[id]/play — requiere sesión
  if (PROTECTED_ROUTES.test(pathname)) {
    if (!isAuthenticated(request)) {
      const authUrl = request.nextUrl.clone();
      authUrl.pathname = '/auth';
      return NextResponse.redirect(authUrl);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
