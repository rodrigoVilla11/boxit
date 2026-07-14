import { apiFetch, extractError } from './api-client';
import type { Exercise, Workout } from './workouts';

export type RoutineExercise = {
  id: string;
  order: number;
  exerciseId: string;
  targetSets: number;
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
