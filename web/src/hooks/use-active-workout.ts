'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/toast-provider';
import * as api from '@/lib/workouts';
import type { PreviousSession, SetPatch, Workout, WorkoutSet } from '@/lib/workouts';

function friendlyError(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : fallback;
  return /failed to fetch|networkerror|network request failed/i.test(msg)
    ? 'Sin conexión. Revisá tu internet.'
    : msg;
}

function replaceSet(workout: Workout, updated: WorkoutSet): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => ({
      ...we,
      sets: we.sets.map((s) => (s.id === updated.id ? updated : s)),
    })),
  };
}

// Reordena localmente los ejercicios según `ids` (para la UI optimista).
function reorderExercisesLocal(workout: Workout, ids: string[]): Workout {
  const byId = new Map(workout.exercises.map((e) => [e.id, e]));
  const next = ids
    .map((id, i) => {
      const e = byId.get(id);
      return e ? { ...e, order: i + 1 } : null;
    })
    .filter((e): e is Workout['exercises'][number] => e !== null);
  return { ...workout, exercises: next };
}

// Reordena localmente las series de un ejercicio según `ids`.
function reorderSetsLocal(
  workout: Workout,
  workoutExerciseId: string,
  ids: string[],
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => {
      if (we.id !== workoutExerciseId) return we;
      const byId = new Map(we.sets.map((s) => [s.id, s]));
      const sets = ids
        .map((id, i) => {
          const s = byId.get(id);
          return s ? { ...s, order: i + 1 } : null;
        })
        .filter((s): s is WorkoutSet => s !== null);
      return { ...we, sets };
    }),
  };
}

export type UseActiveWorkout = {
  workout: Workout | null;
  previous: Record<string, PreviousSession>;
  loading: boolean;
  starting: boolean;
  error: string | null;
  start: () => Promise<void>;
  // las mutaciones devuelven true si se guardó ok (ante error: toast + resync)
  addExercise: (exerciseId: string) => Promise<boolean>;
  removeExercise: (workoutExerciseId: string) => Promise<boolean>;
  addSet: (workoutExerciseId: string) => Promise<boolean>;
  removeSet: (setId: string) => Promise<boolean>;
  saveSet: (setId: string, patch: SetPatch) => Promise<boolean>;
  reorderExercises: (ids: string[]) => Promise<boolean>;
  reorderSets: (workoutExerciseId: string, ids: string[]) => Promise<boolean>;
  finish: () => Promise<Workout | null>;
  discard: () => Promise<void>;
};

export function useActiveWorkout(): UseActiveWorkout {
  const toast = useToast();
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

  // Re-sincroniza el entreno con el server (rollback ante error de mutación)
  const resync = async () => {
    try {
      setWorkout(await api.getActiveWorkout());
    } catch {
      /* sin conexión: dejamos el estado como está */
    }
  };

  const run = async (fn: () => Promise<void>): Promise<boolean> => {
    try {
      await fn();
      return true;
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo guardar.'));
      await resync();
      return false;
    }
  };

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      setWorkout(await api.createWorkout());
    } catch (e) {
      const msg = friendlyError(e, 'No se pudo empezar el entreno.');
      setError(msg);
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  const addExercise = (exerciseId: string) =>
    run(async () => {
      setWorkout(await api.addExercise(guardedId(), exerciseId));
    });

  const removeExercise = (workoutExerciseId: string) =>
    run(async () => {
      setWorkout(await api.removeExercise(guardedId(), workoutExerciseId));
    });

  const addSet = (workoutExerciseId: string) =>
    run(async () => {
      setWorkout(await api.addSet(guardedId(), workoutExerciseId));
    });

  const removeSet = (setId: string) =>
    run(async () => {
      setWorkout(await api.removeSet(guardedId(), setId));
    });

  const saveSet = (setId: string, patch: SetPatch) =>
    run(async () => {
      const updated = await api.updateSet(guardedId(), setId, patch);
      setWorkout((w) => (w ? replaceSet(w, updated) : w));
    });

  const reorderExercises = (ids: string[]) =>
    run(async () => {
      setWorkout((w) => (w ? reorderExercisesLocal(w, ids) : w)); // optimista
      setWorkout(await api.reorderExercises(guardedId(), ids));
    });

  const reorderSets = (workoutExerciseId: string, ids: string[]) =>
    run(async () => {
      setWorkout((w) => (w ? reorderSetsLocal(w, workoutExerciseId, ids) : w));
      setWorkout(await api.reorderSets(guardedId(), workoutExerciseId, ids));
    });

  const finish = async (): Promise<Workout | null> => {
    try {
      const done = await api.finishWorkout(guardedId());
      setWorkout(null);
      setPrevious({});
      return done;
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo terminar el entreno.'));
      return null;
    }
  };

  const discard = async () => {
    try {
      await api.discardWorkout(guardedId());
      setWorkout(null);
      setPrevious({});
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo descartar.'));
    }
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
    reorderExercises,
    reorderSets,
    finish,
    discard,
  };
}
