import { apiFetch, extractError } from './api-client';
import type { ActivityType } from './activities';
import type { CardioRoutine } from './cardio-routines';
import type { PlanItemKind } from './plans';

/** Una sesión programada en el calendario (fecha absoluta). */
export type ScheduledSession = {
  id: string;
  programId: string | null;
  program: { id: string; name: string } | null;
  date: string; // ISO a mediodía UTC: sólo importa el día → usar sessionDay()
  order: number;
  kind: PlanItemKind;
  routineId: string | null;
  routine: { id: string; name: string } | null;
  cardioRoutineId: string | null;
  cardioRoutine: CardioRoutine | null;
  activityType: ActivityType | null;
  targetDistanceM: number | null;
  targetDurationSec: number | null;
  note: string | null;
};

export type ScheduledSessionInput = {
  date: string; // YYYY-MM-DD (día local)
  kind: PlanItemKind;
  routineId?: string;
  cardioRoutineId?: string | null;
  activityType?: ActivityType;
  targetDistanceM?: number | null;
  targetDurationSec?: number | null;
  note?: string | null;
};

/** Programa multi-semana: agrupa sesiones para listarlas y borrarlas de una. */
export type TrainingProgram = {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  sessionCount: number;
  startDate: string | null;
  endDate: string | null;
};

/** Día local YYYY-MM-DD (lo que espera la API). */
export function toDayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Día de una sesión como Date LOCAL a medianoche. La fecha viaja a mediodía
 * UTC, así que los componentes UTC son el día correcto en cualquier timezone.
 */
export function sessionDay(isoDate: string): Date {
  const d = new Date(isoDate);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Objetivos efectivos de una sesión de cardio: si la plantilla sigue viva
 * manda ella; los valores copiados son el respaldo (igual que en el plan).
 */
export function sessionTargets(s: ScheduledSession): {
  type: ActivityType | null;
  distanceM: number | null;
  durationSec: number | null;
} {
  const c = s.cardioRoutine;
  return {
    type: c?.type ?? s.activityType,
    distanceM: c ? c.targetDistanceM : s.targetDistanceM,
    durationSec: c ? c.targetDurationSec : s.targetDurationSec,
  };
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

/** Sesiones programadas en el rango [from, to] (días locales, inclusive). */
export async function getSchedule(
  from: Date,
  to: Date,
): Promise<ScheduledSession[]> {
  const res = await apiFetch(
    `/api/schedule?from=${toDayStr(from)}&to=${toDayStr(to)}`,
  );
  return json<ScheduledSession[]>(res, 'No pudimos cargar el calendario.');
}

export async function createSession(
  input: ScheduledSessionInput,
): Promise<ScheduledSession> {
  const res = await apiFetch('/api/schedule', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json<ScheduledSession>(res, 'No pudimos programar la sesión.');
}

export async function updateSession(
  id: string,
  patch: {
    date?: string;
    targetDistanceM?: number | null;
    targetDurationSec?: number | null;
    note?: string | null;
  },
): Promise<ScheduledSession> {
  const res = await apiFetch(`/api/schedule/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return json<ScheduledSession>(res, 'No pudimos guardar la sesión.');
}

/**
 * Copia todas las sesiones de la semana del lunes `weekStart` a las próximas
 * `weeks` semanas. Devuelve cuántas sesiones se programaron.
 */
export async function duplicateWeek(
  weekStart: Date,
  weeks: number,
): Promise<number> {
  const res = await apiFetch('/api/schedule/duplicate-week', {
    method: 'POST',
    body: JSON.stringify({ weekStart: toDayStr(weekStart), weeks }),
  });
  const data = await json<{ created: number }>(
    res,
    'No pudimos duplicar la semana.',
  );
  return data.created;
}

export async function deleteSession(id: string): Promise<void> {
  const res = await apiFetch(`/api/schedule/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar la sesión.');
}

export async function getPrograms(): Promise<TrainingProgram[]> {
  const res = await apiFetch('/api/programs');
  return json<TrainingProgram[]>(res, 'No pudimos cargar tus programas.');
}

/** Crea el programa con TODAS sus sesiones de una. */
export async function createProgram(input: {
  name: string;
  note?: string | null;
  sessions: ScheduledSessionInput[];
}): Promise<TrainingProgram> {
  const res = await apiFetch('/api/programs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json<TrainingProgram>(res, 'No pudimos crear el programa.');
}

/** Borra el programa y todas sus sesiones del calendario. */
export async function deleteProgram(id: string): Promise<void> {
  const res = await apiFetch(`/api/programs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar el programa.');
}
