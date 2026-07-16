import { apiFetch, extractError } from './api-client';

export type MuscleKey =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'CORE'
  | 'FOREARMS';

export type MuscleStat = { muscle: MuscleKey; sets: number; score: number };

export type ExerciseHistoryPoint = {
  workoutId: string;
  date: string | null;
  metric: 'weight' | 'reps';
  value: number;
  reps: number;
};

async function json<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(extractError(data, fallback));
  return data as T;
}

export async function getMuscleMap(days = 30): Promise<MuscleStat[]> {
  const res = await apiFetch(`/api/workouts/muscle-map?days=${days}`);
  return json<MuscleStat[]>(res, 'No pudimos cargar el mapa de músculos.');
}

export async function getExerciseHistory(
  exerciseId: string,
  days?: number,
): Promise<ExerciseHistoryPoint[]> {
  const q = days && days > 0 ? `?days=${days}` : '';
  const res = await apiFetch(`/api/exercises/${exerciseId}/history${q}`);
  return json<ExerciseHistoryPoint[]>(res, 'No pudimos cargar la progresión.');
}
