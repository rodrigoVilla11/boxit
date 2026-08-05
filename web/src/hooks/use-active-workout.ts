'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/toast-provider';
import { useSync } from '@/components/sync-provider';
import * as api from '@/lib/workouts';
import type {
  Exercise,
  PreviousSession,
  SetPatch,
  Workout,
  WorkoutPatch,
} from '@/lib/workouts';
import { commit, getQueue, loadDoc, saveDoc } from '@/lib/offline/active-store';
import type { Op } from '@/lib/offline/types';

function friendlyError(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : fallback;
  return /failed to fetch|networkerror|network request failed/i.test(msg)
    ? 'Sin conexión. Revisá tu internet.'
    : msg;
}

const uuid = (): string => crypto.randomUUID();
const now = (): number => Date.now();

export type UseActiveWorkout = {
  workout: Workout | null;
  previous: Record<string, PreviousSession>;
  loading: boolean;
  starting: boolean;
  error: string | null;
  start: () => Promise<void>;
  reload: () => Promise<void>; // re-hidrata (p.ej. tras arrancar una rutina)
  // las mutaciones son local-first: devuelven true si se aplicó al doc local
  addExercise: (exercise: Exercise) => Promise<boolean>;
  removeExercise: (workoutExerciseId: string) => Promise<boolean>;
  replaceExercise: (workoutExerciseId: string, exercise: Exercise) => Promise<boolean>;
  addSet: (workoutExerciseId: string) => Promise<boolean>;
  removeSet: (setId: string) => Promise<boolean>;
  saveSet: (setId: string, patch: SetPatch) => Promise<boolean>;
  saveWorkout: (patch: WorkoutPatch) => Promise<boolean>;
  setSuperset: (workoutExerciseId: string, group: number | null) => Promise<boolean>;
  reorderExercises: (ids: string[]) => Promise<boolean>;
  reorderSets: (workoutExerciseId: string, ids: string[]) => Promise<boolean>;
  finish: () => Promise<Workout | null>;
  discard: () => Promise<void>;
};

export function useActiveWorkout(): UseActiveWorkout {
  const toast = useToast();
  const sync = useSync();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [previous, setPrevious] = useState<Record<string, PreviousSession>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidratación: el doc local manda. Si no hay doc y no hay cola pendiente,
  // traemos el activo del server (para no resucitar un entreno terminado offline).
  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await loadDoc();
      if (doc) {
        setWorkout(doc);
      } else {
        const queue = await getQueue().catch(() => []);
        if (queue.length === 0 && navigator.onLine) {
          const server = await api.getActiveWorkout();
          if (server) await saveDoc(server);
          setWorkout(server);
        } else {
          setWorkout(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Carga el "Anterior" de cada ejercicio (server; offline queda sin dato)
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

  // Aplica un op al doc local + encola + dispara el sync. No falla por red.
  const runCommit = async (op: Op): Promise<boolean> => {
    try {
      const next = await commit(op);
      setWorkout(next);
      sync.kick();
      return true;
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo guardar.'));
      return false;
    }
  };

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const next = await commit({ kind: 'start', workoutId: uuid(), ts: now() });
      setWorkout(next);
      sync.kick();
    } catch (e) {
      const msg = friendlyError(e, 'No se pudo empezar el entreno.');
      setError(msg);
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  const addExercise = (exercise: Exercise) =>
    runCommit({
      kind: 'addExercise',
      workoutId: guardedId(),
      weId: uuid(),
      setId: uuid(),
      exercise,
      ts: now(),
    });

  const removeExercise = (workoutExerciseId: string) =>
    runCommit({
      kind: 'removeExercise',
      workoutId: guardedId(),
      weId: workoutExerciseId,
      ts: now(),
    });

  const replaceExercise = (workoutExerciseId: string, exercise: Exercise) =>
    runCommit({
      kind: 'replaceExercise',
      workoutId: guardedId(),
      weId: workoutExerciseId,
      setId: uuid(),
      exercise,
      ts: now(),
    });

  const addSet = (workoutExerciseId: string) =>
    runCommit({
      kind: 'addSet',
      workoutId: guardedId(),
      weId: workoutExerciseId,
      setId: uuid(),
      ts: now(),
    });

  const removeSet = (setId: string) =>
    runCommit({ kind: 'removeSet', workoutId: guardedId(), setId, ts: now() });

  const saveSet = (setId: string, patch: SetPatch) =>
    runCommit({ kind: 'updateSet', workoutId: guardedId(), setId, patch, ts: now() });

  const saveWorkout = (patch: WorkoutPatch) =>
    runCommit({ kind: 'updateWorkout', workoutId: guardedId(), patch, ts: now() });

  const setSuperset = (workoutExerciseId: string, group: number | null) =>
    runCommit({
      kind: 'setSuperset',
      workoutId: guardedId(),
      weId: workoutExerciseId,
      group,
      ts: now(),
    });

  const reorderExercises = (ids: string[]) =>
    runCommit({ kind: 'reorderExercises', workoutId: guardedId(), ids, ts: now() });

  const reorderSets = (workoutExerciseId: string, ids: string[]) =>
    runCommit({
      kind: 'reorderSets',
      workoutId: guardedId(),
      weId: workoutExerciseId,
      ids,
      ts: now(),
    });

  const finish = async (): Promise<Workout | null> => {
    const doc = await loadDoc();
    if (!doc) return null;
    // resumen con totales calculados en cliente (el server los recomputa al sync)
    const totals = api.liveTotals(doc);
    const durationSec = Math.max(
      0,
      Math.round((Date.now() - new Date(doc.startedAt).getTime()) / 1000),
    );
    const finished: Workout = {
      ...doc,
      finishedAt: new Date().toISOString(),
      durationSec,
      totalVolume: totals.volume,
      totalSets: totals.sets,
    };
    try {
      await commit({ kind: 'finish', workoutId: doc.id, ts: now() });
      setWorkout(null);
      setPrevious({});
      sync.kick();
      return finished;
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo terminar el entreno.'));
      return null;
    }
  };

  const discard = async () => {
    const doc = await loadDoc();
    if (!doc) {
      setWorkout(null);
      return;
    }
    try {
      await commit({ kind: 'discard', workoutId: doc.id, ts: now() });
      setWorkout(null);
      setPrevious({});
      sync.kick();
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
    reload: hydrate,
    addExercise,
    removeExercise,
    replaceExercise,
    addSet,
    removeSet,
    saveSet,
    saveWorkout,
    setSuperset,
    reorderExercises,
    reorderSets,
    finish,
    discard,
  };
}
