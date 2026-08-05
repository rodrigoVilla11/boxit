import { apiFetch, extractError } from './api-client';

type RawSet = {
  type?: string;
  weight?: number;
  reps?: number;
  completed?: boolean;
  rpe?: number | null;
  note?: string | null;
  order?: number;
};
type RawExercise = {
  exerciseId?: string;
  exercise?: { name?: string };
  order?: number;
  targetReps?: number | null;
  targetWeight?: number | null;
  restSeconds?: number | null;
  supersetGroup?: number | null;
  sets?: RawSet[];
};
type RawWorkout = {
  title?: string | null;
  note?: string | null;
  startedAt?: string;
  finishedAt?: string;
  durationSec?: number;
  exercises?: RawExercise[];
};
type RawExport = { workouts?: RawWorkout[] };

/**
 * Importa entrenos desde un archivo de export JSON de BOX iT. Transforma a la
 * forma mínima que espera la API (sin ids del archivo) y devuelve cuántos entró.
 */
export async function importWorkoutsFromFile(file: File): Promise<number> {
  let data: RawExport;
  try {
    data = JSON.parse(await file.text()) as RawExport;
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const workouts = Array.isArray(data.workouts) ? data.workouts : [];
  if (workouts.length === 0) {
    throw new Error('El archivo no tiene entrenos para importar.');
  }

  const payload = {
    workouts: workouts.map((w) => ({
      title: w.title ?? null,
      note: w.note ?? null,
      startedAt: w.startedAt,
      finishedAt: w.finishedAt,
      durationSec: w.durationSec,
      exercises: (w.exercises ?? []).map((we, i) => ({
        exerciseId: we.exerciseId,
        name: we.exercise?.name,
        order: we.order ?? i + 1,
        targetReps: we.targetReps ?? null,
        targetWeight: we.targetWeight ?? null,
        restSeconds: we.restSeconds ?? null,
        supersetGroup: we.supersetGroup ?? null,
        sets: (we.sets ?? []).map((s, j) => ({
          type: s.type,
          weight: s.weight,
          reps: s.reps,
          completed: s.completed,
          rpe: s.rpe ?? null,
          note: s.note ?? null,
          order: s.order ?? j + 1,
        })),
      })),
    })),
  };

  const res = await apiFetch('/api/workouts/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractError(body, 'No se pudo importar.'));
  return (body as { imported: number }).imported;
}
