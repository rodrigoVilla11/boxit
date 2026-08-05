import { ACTIVE_STORE, DOC_KEY, QUEUE_STORE, getDb } from './db';
import { applyOp } from './reducers';
import type { Op, QueuedOp } from './types';
import type { Workout } from '../workouts';
import * as api from '../workouts';

export async function loadDoc(): Promise<Workout | null> {
  const db = await getDb();
  return (await db.get(ACTIVE_STORE, DOC_KEY)) ?? null;
}

export async function saveDoc(doc: Workout | null): Promise<void> {
  const db = await getDb();
  if (doc) await db.put(ACTIVE_STORE, doc, DOC_KEY);
  else await db.delete(ACTIVE_STORE, DOC_KEY);
}

async function enqueue(op: Op): Promise<void> {
  const db = await getDb();
  await db.add(QUEUE_STORE, op); // idb inyecta `seq` (auto-increment)
}

export async function getQueue(): Promise<QueuedOp[]> {
  const db = await getDb();
  return (await db.getAll(QUEUE_STORE)) as QueuedOp[]; // ordenados por seq
}

export async function removeOp(seq: number): Promise<void> {
  const db = await getDb();
  await db.delete(QUEUE_STORE, seq);
}

export async function queueSize(): Promise<number> {
  const db = await getDb();
  return db.count(QUEUE_STORE);
}

// Serializa los commits para evitar carreras load→apply→save.
let chain: Promise<unknown> = Promise.resolve();

/** Aplica un op al doc local, lo persiste y lo encola. Devuelve el nuevo doc. */
export function commit(op: Op): Promise<Workout | null> {
  const run = async (): Promise<Workout | null> => {
    const doc = await loadDoc();
    const next = applyOp(doc, op);
    await saveDoc(next);
    await enqueue(op);
    return next;
  };
  const p = chain.then(run, run);
  chain = p.catch(() => {});
  return p;
}

/** Ejecuta un op contra el server. Idempotente gracias a los ids del cliente. */
export async function syncOp(op: QueuedOp): Promise<void> {
  switch (op.kind) {
    case 'start':
      await api.createWorkout(op.workoutId);
      return;
    case 'addExercise':
      await api.addExercise(op.workoutId, op.exercise.id, {
        id: op.weId,
        setId: op.setId,
      });
      return;
    case 'removeExercise':
      await api.removeExercise(op.workoutId, op.weId);
      return;
    case 'replaceExercise':
      await api.replaceExercise(op.workoutId, op.weId, op.exercise.id, {
        setId: op.setId,
      });
      return;
    case 'addSet':
      await api.addSet(op.workoutId, op.weId, { id: op.setId });
      return;
    case 'updateSet':
      await api.updateSet(op.workoutId, op.setId, op.patch);
      return;
    case 'updateWorkout':
      await api.updateWorkout(op.workoutId, op.patch);
      return;
    case 'setSuperset':
      await api.setSuperset(op.workoutId, op.weId, op.group);
      return;
    case 'removeSet':
      await api.removeSet(op.workoutId, op.setId);
      return;
    case 'reorderExercises':
      await api.reorderExercises(op.workoutId, op.ids);
      return;
    case 'reorderSets':
      await api.reorderSets(op.workoutId, op.weId, op.ids);
      return;
    case 'finish':
      await api.finishWorkout(op.workoutId);
      return;
    case 'discard':
      await api.discardWorkout(op.workoutId);
      return;
  }
}
