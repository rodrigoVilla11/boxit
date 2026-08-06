import { NextRequest, NextResponse } from 'next/server';

// Cookie de sesión (refresh token httpOnly seteado por la API). El middleware solo
// verifica *presencia* para redirigir; la validación real del JWT la hace la API
// en cada endpoint protegido.
const SESSION_COOKIE = 'boxit_rt';

// Rutas públicas (no requieren sesión)
const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Ya logueado entrando a login/register → a la home
  if (isPublic && hasSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Ruta protegida sin sesión → a login (guardando a dónde iba)
  if (!isPublic && !hasSession) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Corre en todo, menos el proxy /api, assets estáticos, SW, manifest, íconos
  // y el shell offline. /api NO pasa por acá: lo maneja el route handler proxy.
  matcher: [
    '/((?!api|_next|icons|manifest.webmanifest|sw.js|icon.png|favicon.ico|~offline).*)',
  ],
};
