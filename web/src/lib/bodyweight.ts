import { apiFetch, extractError } from './api-client';

export type Bodyweight = {
  id: string;
  weightKg: number; // siempre en kg; convertir con lib/units
  takenAt: string;
  note: string | null;
  createdAt: string;
};

export type BodyweightInput = {
  weightKg: number;
  takenAt?: string;
  note?: string | null;
};

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

/** Registros de peso corporal, del más nuevo al más viejo. */
export async function getBodyweights(): Promise<Bodyweight[]> {
  const res = await apiFetch('/api/bodyweight');
  return json<Bodyweight[]>(res, 'No pudimos cargar tu peso.');
}

export async function createBodyweight(
  input: BodyweightInput,
): Promise<Bodyweight> {
  const res = await apiFetch('/api/bodyweight', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json<Bodyweight>(res, 'No pudimos guardar tu peso.');
}

export async function updateBodyweight(
  id: string,
  input: Partial<BodyweightInput>,
): Promise<Bodyweight> {
  const res = await apiFetch(`/api/bodyweight/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return json<Bodyweight>(res, 'No pudimos actualizar tu peso.');
}

export async function deleteBodyweight(id: string): Promise<void> {
  const res = await apiFetch(`/api/bodyweight/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar el registro.');
}
