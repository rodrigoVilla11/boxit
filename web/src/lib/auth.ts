import { apiFetch, extractError } from './api-client';
import type { WeightUnit } from './units';

export type Sex = 'MALE' | 'FEMALE' | 'OTHER';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  weightUnit: WeightUnit;
  isAdmin: boolean;
  // perfil (todo opcional)
  birthDate: string | null; // YYYY-MM-DD
  sex: Sex | null;
  heightCm: number | null;
  goalWeightKg: number | null; // siempre en kg
  // recordatorios push
  reminderEnabled: boolean;
  reminderHour: number;
  inactivityReminderDays: number | null;
  timezoneOffsetMin: number | null;
};

/** Parche de perfil: omitir un campo lo deja igual; null lo limpia. */
export type ProfilePatch = {
  name?: string;
  weightUnit?: WeightUnit;
  birthDate?: string | null;
  sex?: Sex | null;
  heightCm?: number | null;
  goalWeightKg?: number | null;
  reminderEnabled?: boolean;
  reminderHour?: number;
  inactivityReminderDays?: number | null;
  timezoneOffsetMin?: number | null;
};

async function parse(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

export async function login(
  email: string,
  password: string,
): Promise<SessionUser> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await parse(res);
  if (!res.ok) throw new Error(extractError(data, 'No pudimos iniciar sesión.'));
  return (data as { user: SessionUser }).user;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<SessionUser> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await parse(res);
  if (!res.ok) throw new Error(extractError(data, 'No pudimos crear la cuenta.'));
  return (data as { user: SessionUser }).user;
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<SessionUser | null> {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return null;
  const data = await parse(res);
  return (data as { user: SessionUser }).user;
}

export async function updateProfile(patch: ProfilePatch): Promise<SessionUser> {
  const res = await apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  const data = await parse(res);
  if (!res.ok) throw new Error(extractError(data, 'No se pudo guardar.'));
  return (data as { user: SessionUser }).user;
}

export function updateWeightUnit(weightUnit: WeightUnit): Promise<SessionUser> {
  return updateProfile({ weightUnit });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await apiFetch('/api/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const data = await parse(res);
    throw new Error(extractError(data, 'No pudimos cambiar la contraseña.'));
  }
}

export async function deleteAccount(): Promise<void> {
  const res = await apiFetch('/api/auth/me', { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar la cuenta.');
}
