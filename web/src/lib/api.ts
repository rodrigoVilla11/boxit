/**
 * Base URL de la API.
 * - Server-side (SSR / server components): API_INTERNAL_URL (en Docker: http://api:3001)
 * - Client-side (navegador): NEXT_PUBLIC_API_URL ("" en prod → mismo origen vía Nginx)
 */
export const API_BASE =
  typeof window === 'undefined'
    ? process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

export type Exercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  createdAt: string;
};

/** Cuenta ejercicios de la librería (server-side). Devuelve null si la API no está arriba. */
export async function getExerciseCount(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/api/exercises`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return Array.isArray(data) ? data.length : null;
  } catch {
    return null;
  }
}
