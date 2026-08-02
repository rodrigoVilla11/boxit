import { apiFetch, extractError } from './api-client';
import type { ActivityType } from './activities';

export type PlanItemKind = 'ROUTINE' | 'ACTIVITY' | 'REST';

export type PlanItem = {
  id: string;
  dayOfWeek: number; // 0 = lunes .. 6 = domingo
  order: number;
  kind: PlanItemKind;
  routineId: string | null;
  routine: { id: string; name: string } | null;
  activityType: ActivityType | null;
  targetDistanceM: number | null;
  targetDurationSec: number | null;
  note: string | null;
};

export type WeeklyPlan = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  items: PlanItem[];
};

export type PlanItemInput = {
  dayOfWeek: number;
  kind: PlanItemKind;
  routineId?: string;
  activityType?: ActivityType;
  targetDistanceM?: number | null;
  targetDurationSec?: number | null;
  note?: string | null;
};

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

export async function getPlans(): Promise<WeeklyPlan[]> {
  const res = await apiFetch('/api/plans');
  return json<WeeklyPlan[]>(res, 'No pudimos cargar tus planes.');
}

export async function getPlan(id: string): Promise<WeeklyPlan> {
  const res = await apiFetch(`/api/plans/${id}`);
  return json<WeeklyPlan>(res, 'No pudimos cargar el plan.');
}

export async function createPlan(
  name: string,
  items: PlanItemInput[],
): Promise<WeeklyPlan> {
  const res = await apiFetch('/api/plans', {
    method: 'POST',
    body: JSON.stringify({ name, items }),
  });
  return json<WeeklyPlan>(res, 'No pudimos crear el plan.');
}

export async function updatePlan(
  id: string,
  patch: { name?: string; items?: PlanItemInput[] },
): Promise<WeeklyPlan> {
  const res = await apiFetch(`/api/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return json<WeeklyPlan>(res, 'No pudimos guardar el plan.');
}

export async function deletePlan(id: string): Promise<void> {
  const res = await apiFetch(`/api/plans/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar el plan.');
}

export async function activatePlan(id: string): Promise<WeeklyPlan> {
  const res = await apiFetch(`/api/plans/${id}/activate`, { method: 'PATCH' });
  return json<WeeklyPlan>(res, 'No pudimos activar el plan.');
}
