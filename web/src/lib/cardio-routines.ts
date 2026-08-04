import { apiFetch, extractError } from './api-client';
import type { ActivityIntervalInput, ActivityType } from './activities';

/** Un intervalo de plantilla: reps × (distancia|tiempo) + descanso. */
export type CardioRoutineInterval = {
  id: string;
  order: number;
  label: string | null;
  reps: number;
  distanceM: number | null; // por repetición
  durationSec: number | null; // por repetición
  restSec: number | null;
};

/**
 * Plantilla de cardio: el equivalente a una rutina de gym. Puede ser continua
 * (sólo objetivos totales) o por intervalos.
 */
export type CardioRoutine = {
  id: string;
  name: string;
  type: ActivityType;
  targetDistanceM: number | null;
  targetDurationSec: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  intervals: CardioRoutineInterval[];
};

export type CardioRoutineInput = {
  name: string;
  type: ActivityType;
  targetDistanceM?: number | null;
  targetDurationSec?: number | null;
  note?: string | null;
  intervals?: ActivityIntervalInput[];
};

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

export async function getCardioRoutines(): Promise<CardioRoutine[]> {
  const res = await apiFetch('/api/cardio-routines');
  return json<CardioRoutine[]>(res, 'No pudimos cargar tus plantillas de cardio.');
}

export async function createCardioRoutine(
  input: CardioRoutineInput,
): Promise<CardioRoutine> {
  const res = await apiFetch('/api/cardio-routines', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json<CardioRoutine>(res, 'No pudimos crear la plantilla.');
}

export async function updateCardioRoutine(
  id: string,
  input: CardioRoutineInput,
): Promise<CardioRoutine> {
  const res = await apiFetch(`/api/cardio-routines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return json<CardioRoutine>(res, 'No pudimos guardar la plantilla.');
}

export async function deleteCardioRoutine(id: string): Promise<void> {
  const res = await apiFetch(`/api/cardio-routines/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos borrar la plantilla.');
}

/**
 * Resumen legible de los intervalos: "8 × 400 m · 90 s desc.". Vacío si no hay.
 * Se usa en las tarjetas y en el plan semanal.
 */
export function intervalsSummary(
  intervals: Pick<
    CardioRoutineInterval,
    'reps' | 'distanceM' | 'durationSec' | 'restSec' | 'label'
  >[],
): string {
  return intervals
    .map((iv) => {
      const load = iv.distanceM
        ? `${iv.distanceM} m`
        : iv.durationSec
          ? `${iv.durationSec} s`
          : (iv.label?.trim() ?? '');
      const head = iv.reps > 1 ? `${iv.reps} × ${load}` : load;
      return iv.restSec ? `${head} (${iv.restSec} s desc.)` : head;
    })
    .filter(Boolean)
    .join(' · ');
}
