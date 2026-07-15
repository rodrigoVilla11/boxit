// Cliente de API para el navegador. Siempre manda cookies (credentials: 'include')
// y, ante un 401, intenta refrescar la sesión una vez y reintenta el request.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export type Exercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  createdAt: string;
};

// Single-flight: si llegan varios 401 juntos, un solo refresh para todos.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

const NO_RETRY = new Set(['/api/auth/refresh', '/api/auth/login', '/api/auth/register']);

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const opts: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  };

  let res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401 && !NO_RETRY.has(path)) {
    const ok = await refreshSession();
    if (ok) {
      res = await fetch(`${API_BASE}${path}`, opts);
    }
  }

  return res;
}

/** Extrae un mensaje de error legible de una respuesta de NestJS. */
export function extractError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return String(m[0] ?? fallback);
    if (typeof m === 'string') return m;
  }
  return fallback;
}
