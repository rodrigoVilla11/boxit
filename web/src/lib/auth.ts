import { apiFetch, extractError } from './api-client';

export type SessionUser = { id: string; email: string; name: string };

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
