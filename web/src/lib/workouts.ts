import { apiFetch, extractError, type Exercise } from './api-client';

export type { Exercise };
export type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';

/** Criterio único (espeja el back): volumen = todo menos calentamiento. */
export function isVolumeSet(type: SetType): boolean {
  return type !== 'WARMUP';
}

/** Elegible para récord: trabajo real (no calentamiento, no drop). */
export function isPrEligible(type: SetType): boolean {
  return type === 'NORMAL' || type === 'FAILURE';
}

export type WorkoutSet = {
  id: string;
  order: number;
  type: SetType;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt: string | null;
  rpe: number | null;
  note: string | null;
};

export type WorkoutExercise = {
  id: string;
  order: number;
  exerciseId: string;
  exercise: Exercise;
  // objetivos de la rutina (guía); null en alta manual
  targetReps: number | null;
  targetWeight: number | null;
  restSeconds: number | null;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  title: string | null;
  note: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number;
  totalVolume: number;
  totalSets: number;
  exercises: WorkoutExercise[];
};

export type WorkoutPatch = Partial<{ title: string | null; note: string | null }>;

export type PreviousSet = {
  order: number;
  weight: number;
  reps: number;
  type: SetType;
};

export type PreviousSession = {
  workoutId: string;
  performedAt: string | null;
  sets: PreviousSet[];
} | null;

export type SetPatch = Partial<{
  weight: number;
  reps: number;
  completed: boolean;
  type: SetType;
  rpe: number | null;
  note: string | null;
}>;

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

export async function getExercises(): Promise<Exercise[]> {
  const res = await apiFetch('/api/exercises');
  return json<Exercise[]>(res, 'No pudimos cargar la librería.');
}

export type ExerciseInput = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  description?: string;
  videoUrl?: string;
  global?: boolean;
};

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const res = await apiFetch('/api/exercises', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json<Exercise>(res, 'No pudimos crear el ejercicio.');
}

export async function updateExercise(
  id: string,
  input: ExerciseInput,
): Promise<Exercise> {
  const res = await apiFetch(`/api/exercises/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return json<Exercise>(res, 'No pudimos guardar el ejercicio.');
}

export async function deleteExercise(id: string): Promise<void> {
  const res = await apiFetch(`/api/exercises/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    throw new Error(extractError(data, 'No pudimos eliminar el ejercicio.'));
  }
}

export async function getActiveWorkout(): Promise<Workout | null> {
  const res = await apiFetch('/api/workouts/active');
  return json<Workout | null>(res, 'No pudimos cargar el entreno.');
}

export async function createWorkout(id?: string): Promise<Workout> {
  const res = await apiFetch('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(id ? { id } : {}),
  });
  return json<Workout>(res, 'No pudimos empezar el entreno.');
}

export async function finishWorkout(id: string): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}/finish`, { method: 'PATCH' });
  return json<Workout>(res, 'No pudimos terminar el entreno.');
}

/** Título/nota de la sesión (activo o terminado). */
export async function updateWorkout(
  id: string,
  patch: WorkoutPatch,
): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return json<Workout>(res, 'No pudimos guardar la sesión.');
}

/** Clona un entreno terminado en uno nuevo activo (sin completar). */
export async function repeatWorkout(id: string): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}/repeat`, { method: 'POST' });
  return json<Workout>(res, 'No pudimos repetir el entreno.');
}

export async function discardWorkout(id: string): Promise<void> {
  const res = await apiFetch(`/api/workouts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos descartar el entreno.');
}

export async function addExercise(
  id: string,
  exerciseId: string,
  ids?: { id?: string; setId?: string },
): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}/exercises`, {
    method: 'POST',
    body: JSON.stringify({ exerciseId, ...ids }),
  });
  return json<Workout>(res, 'No pudimos agregar el ejercicio.');
}

export async function removeExercise(
  id: string,
  workoutExerciseId: string,
): Promise<Workout> {
  const res = await apiFetch(
    `/api/workouts/${id}/exercises/${workoutExerciseId}`,
    { method: 'DELETE' },
  );
  return json<Workout>(res, 'No pudimos quitar el ejercicio.');
}

export async function addSet(
  id: string,
  workoutExerciseId: string,
  ids?: { id?: string },
): Promise<Workout> {
  const res = await apiFetch(
    `/api/workouts/${id}/exercises/${workoutExerciseId}/sets`,
    { method: 'POST', body: JSON.stringify(ids ?? {}) },
  );
  return json<Workout>(res, 'No pudimos agregar la serie.');
}

export async function updateSet(
  id: string,
  setId: string,
  patch: SetPatch,
): Promise<WorkoutSet> {
  const res = await apiFetch(`/api/workouts/${id}/sets/${setId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return json<WorkoutSet>(res, 'No pudimos guardar la serie.');
}

export async function removeSet(id: string, setId: string): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}/sets/${setId}`, {
    method: 'DELETE',
  });
  return json<Workout>(res, 'No pudimos quitar la serie.');
}

/** Reordena los ejercicios del entreno (ids = orden completo). */
export async function reorderExercises(
  id: string,
  ids: string[],
): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}/exercises/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
  return json<Workout>(res, 'No pudimos reordenar los ejercicios.');
}

/** Reordena las series de un ejercicio del entreno (ids = orden completo). */
export async function reorderSets(
  id: string,
  workoutExerciseId: string,
  ids: string[],
): Promise<Workout> {
  const res = await apiFetch(
    `/api/workouts/${id}/exercises/${workoutExerciseId}/sets/reorder`,
    { method: 'PATCH', body: JSON.stringify({ ids }) },
  );
  return json<Workout>(res, 'No pudimos reordenar las series.');
}

export async function getPrevious(exerciseId: string): Promise<PreviousSession> {
  const res = await apiFetch(`/api/exercises/${exerciseId}/previous`);
  return json<PreviousSession>(res, 'No pudimos cargar el anterior.');
}

// ---------- Historial / PRs ----------

export type WorkoutExerciseSummary = {
  id: string;
  order: number;
  exerciseId: string;
  exercise: Exercise;
};

export type WorkoutSummary = {
  id: string;
  title: string | null;
  note: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number;
  totalVolume: number;
  totalSets: number;
  exercises: WorkoutExerciseSummary[];
};

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  metric: 'weight' | 'reps';
  weight: number;
  reps: number;
  workoutId: string;
  achievedAt: string | null;
};

export async function getHistory(): Promise<WorkoutSummary[]> {
  const res = await apiFetch('/api/workouts');
  return json<WorkoutSummary[]>(res, 'No pudimos cargar el historial.');
}

export async function getWorkoutById(id: string): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}`);
  return json<Workout>(res, 'No pudimos cargar el entreno.');
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const res = await apiFetch('/api/workouts/prs');
  return json<PersonalRecord[]>(res, 'No pudimos cargar los récords.');
}

/** Totales en vivo (misma regla que el back: warmups excluidos). */
export function liveTotals(workout: Workout): { volume: number; sets: number } {
  const working = workout.exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.completed && isVolumeSet(s.type));
  return {
    volume: working.reduce((acc, s) => acc + s.weight * s.reps, 0),
    sets: working.length,
  };
}
