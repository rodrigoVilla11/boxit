import { apiFetch, extractError } from './api-client';

export type ActivityType = 'RUN' | 'SWIM' | 'BIKE' | 'ROW' | 'WALK' | 'OTHER';

export type ActivityInterval = {
  id: string;
  order: number;
  label: string | null;
  reps: number;
  distanceM: number | null; // por repetición
  durationSec: number | null; // por repetición
  restSec: number | null;
};

export type Activity = {
  id: string;
  type: ActivityType;
  label: string | null;
  performedAt: string;
  durationSec: number;
  distanceM: number; // metros (canónico)
  note: string | null;
  createdAt: string;
  intervals: ActivityInterval[];
};

export type ActivityIntervalInput = {
  label?: string | null;
  reps: number;
  distanceM?: number | null;
  durationSec?: number | null;
  restSec?: number | null;
};

export type ActivityInput = {
  id?: string;
  type: ActivityType;
  label?: string | null;
  performedAt?: string;
  durationSec?: number;
  distanceM?: number;
  note?: string | null;
  intervals?: ActivityIntervalInput[];
};

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

/** Actividades del usuario, de la más nueva a la más vieja. */
export async function getActivities(): Promise<Activity[]> {
  const res = await apiFetch('/api/activities');
  return json<Activity[]>(res, 'No pudimos cargar tus actividades.');
}

export async function getActivity(id: string): Promise<Activity> {
  const res = await apiFetch(`/api/activities/${id}`);
  return json<Activity>(res, 'No pudimos cargar la actividad.');
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const res = await apiFetch('/api/activities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json<Activity>(res, 'No pudimos guardar la actividad.');
}

export async function updateActivity(
  id: string,
  input: Partial<ActivityInput>,
): Promise<Activity> {
  const res = await apiFetch(`/api/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return json<Activity>(res, 'No pudimos actualizar la actividad.');
}

export async function deleteActivity(id: string): Promise<void> {
  const res = await apiFetch(`/api/activities/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar la actividad.');
}
