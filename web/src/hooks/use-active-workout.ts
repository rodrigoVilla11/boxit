'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/workouts';
import type { PreviousSession, SetPatch, Workout, WorkoutSet } from '@/lib/workouts';

function replaceSet(workout: Workout, updated: WorkoutSet): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => ({
      ...we,
      sets: we.sets.map((s) => (s.id === updated.id ? updated : s)),
    })),
  };
}

export type UseActiveWorkout = {
  workout: Workout | null;
  previous: Record<string, PreviousSession>;
  loading: boolean;
  starting: boolean;
  error: string | null;
  start: () => Promise<void>;
  addExercise: (exerciseId: string) => Promise<void>;
  removeExercise: (workoutExerciseId: string) => Promise<void>;
  addSet: (workoutExerciseId: string) => Promise<void>;
  removeSet: (setId: string) => Promise<void>;
  saveSet: (setId: string, patch: SetPatch) => Promise<void>;
  finish: () => Promise<Workout | null>;
  discard: () => Promise<void>;
};

export function useActiveWorkout(): UseActiveWorkout {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [previous, setPrevious] = useState<Record<string, PreviousSession>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const active = await api.getActiveWorkout();
        if (alive) setWorkout(active);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Carga el "Anterior" de cada ejercicio del entreno (una vez por ejercicio)
  const exerciseKey = workout
    ? workout.exercises.map((e) => e.exerciseId).join(',')
    : '';
  useEffect(() => {
    if (!workout) return;
    for (const we of workout.exercises) {
      if (!(we.exerciseId in previous)) {
        const id = we.exerciseId;
        setPrevious((prev) => ({ ...prev, [id]: null }));
        api
          .getPrevious(id)
          .then((p) => setPrevious((prev) => ({ ...prev, [id]: p })))
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseKey]);

  const guardedId = (): string => {
    if (!workout) throw new Error('No hay entreno activo.');
    return workout.id;
  };

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      setWorkout(await api.createWorkout());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setStarting(false);
    }
  };

  const addExercise = async (exerciseId: string) => {
    setWorkout(await api.addExercise(guardedId(), exerciseId));
  };

  const removeExercise = async (workoutExerciseId: string) => {
    setWorkout(await api.removeExercise(guardedId(), workoutExerciseId));
  };

  const addSet = async (workoutExerciseId: string) => {
    setWorkout(await api.addSet(guardedId(), workoutExerciseId));
  };

  const removeSet = async (setId: string) => {
    setWorkout(await api.removeSet(guardedId(), setId));
  };

  const saveSet = async (setId: string, patch: SetPatch) => {
    const updated = await api.updateSet(guardedId(), setId, patch);
    setWorkout((w) => (w ? replaceSet(w, updated) : w));
  };

  const finish = async (): Promise<Workout | null> => {
    const id = guardedId();
    const done = await api.finishWorkout(id);
    setWorkout(null);
    setPrevious({});
    return done;
  };

  const discard = async () => {
    await api.discardWorkout(guardedId());
    setWorkout(null);
    setPrevious({});
  };

  return {
    workout,
    previous,
    loading,
    starting,
    error,
    start,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    saveSet,
    finish,
    discard,
  };
}
