import { apiFetch, extractError } from './api-client';
import type { Exercise, Workout } from './workouts';

export type RoutineExercise = {
  id: string;
  order: number;
  exerciseId: string;
  supersetGroup: number | null;
  targetSets: number;
  // targetReps = valor único o mínimo del rango; targetRepsMax = tope (null = único)
  targetReps: number | null;
  targetRepsMax: number | null;
  targetWeight: number | null;
  restSeconds: number | null;
  note: string | null;
  exercise: Exercise;
};

export type Routine = {
  id: string;
  name: string;
  createdAt: string;
  exercises: RoutineExercise[];
};

export type RoutineExerciseInput = {
  exerciseId: string;
  targetSets: number;
  supersetGroup?: number | null;
  targetReps?: number | null;
  targetRepsMax?: number | null;
  targetWeight?: number | null;
  restSeconds?: number | null;
  note?: string | null;
};

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

export async function getRoutines(): Promise<Routine[]> {
  const res = await apiFetch('/api/routines');
  return json<Routine[]>(res, 'No pudimos cargar las rutinas.');
}

export async function getRoutine(id: string): Promise<Routine> {
  const res = await apiFetch(`/api/routines/${id}`);
  return json<Routine>(res, 'No pudimos cargar la rutina.');
}

export async function updateRoutine(
  id: string,
  name: string,
  exercises: RoutineExerciseInput[],
): Promise<Routine> {
  const res = await apiFetch(`/api/routines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, exercises }),
  });
  return json<Routine>(res, 'No pudimos guardar la rutina.');
}

export async function createRoutine(
  name: string,
  exercises: RoutineExerciseInput[],
): Promise<Routine> {
  const res = await apiFetch('/api/routines', {
    method: 'POST',
    body: JSON.stringify({ name, exercises }),
  });
  return json<Routine>(res, 'No pudimos crear la rutina.');
}

export async function deleteRoutine(id: string): Promise<void> {
  const res = await apiFetch(`/api/routines/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No pudimos eliminar la rutina.');
}

export async function startRoutine(id: string): Promise<Workout> {
  const res = await apiFetch(`/api/routines/${id}/start`, { method: 'POST' });
  return json<Workout>(res, 'No pudimos empezar el entreno.');
}
