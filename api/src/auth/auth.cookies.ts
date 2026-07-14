import { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'boxit_at';
export const REFRESH_COOKIE = 'boxit_rt';

// Secure solo en producción: en dev servimos por http://localhost y el navegador
// no guardaría cookies Secure. SameSite=Lax funciona porque front y API comparten
// el mismo site (localhost / mismo dominio detrás de Nginx en prod).
const isProd = process.env.NODE_ENV === 'production';

function cookieOptions(maxAgeSec?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    ...(maxAgeSec !== undefined ? { maxAge: maxAgeSec * 1000 } : {}),
  };
}

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  accessTtl: number;
  refreshTtl: number;
};

export function setAuthCookies(res: Response, tokens: IssuedTokens): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.accessTtl));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTtl));
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, cookieOptions());
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
}
