import type { SetPatch, Workout, WorkoutExercise, WorkoutSet } from '../workouts';
import type { Op } from './types';

function nextOrder(items: { order: number }[]): number {
  return items.reduce((m, i) => Math.max(m, i.order), 0) + 1;
}

function freshSet(
  id: string,
  order: number,
  seed: { weight: number; reps: number } = { weight: 0, reps: 0 },
): WorkoutSet {
  return {
    id,
    order,
    type: 'NORMAL',
    weight: seed.weight,
    reps: seed.reps,
    completed: false,
    completedAt: null,
    rpe: null,
    note: null,
  };
}

function applyPatch(s: WorkoutSet, patch: SetPatch): WorkoutSet {
  const next: WorkoutSet = { ...s };
  if (patch.weight !== undefined) next.weight = patch.weight;
  if (patch.reps !== undefined) next.reps = patch.reps;
  if (patch.type !== undefined) next.type = patch.type;
  if (patch.rpe !== undefined) next.rpe = patch.rpe;
  if (patch.note !== undefined) next.note = patch.note;
  if (patch.completed !== undefined) {
    next.completed = patch.completed;
    next.completedAt = patch.completed ? new Date().toISOString() : null;
  }
  return next;
}

function reorder<T extends { id: string; order: number }>(
  items: T[],
  ids: string[],
): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const next: T[] = [];
  ids.forEach((id, i) => {
    const it = byId.get(id);
    if (it) next.push({ ...it, order: i + 1 });
  });
  return next.length === items.length ? next : items;
}

/** Aplica un op al doc local (optimista). Puro; espeja la lógica del server. */
export function applyOp(doc: Workout | null, op: Op): Workout | null {
  switch (op.kind) {
    case 'start':
      if (doc && doc.finishedAt === null) return doc;
      return {
        id: op.workoutId,
        title: null,
        note: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        durationSec: 0,
        totalVolume: 0,
        totalSets: 0,
        exercises: [],
      };
    case 'finish':
    case 'discard':
      return null; // el doc se limpia al terminar/descartar
  }

  if (!doc) return doc;

  switch (op.kind) {
    case 'addExercise': {
      if (doc.exercises.some((e) => e.id === op.weId)) return doc;
      const we: WorkoutExercise = {
        id: op.weId,
        order: nextOrder(doc.exercises),
        exerciseId: op.exercise.id,
        exercise: op.exercise,
        supersetGroup: null,
        // alta manual: sin objetivos (los targets llegan al empezar una rutina)
        targetReps: null,
        targetRepsMax: null,
        targetWeight: null,
        restSeconds: null,
        sets: [freshSet(op.setId, 1)],
      };
      return { ...doc, exercises: [...doc.exercises, we] };
    }
    case 'removeExercise':
      return { ...doc, exercises: doc.exercises.filter((e) => e.id !== op.weId) };
    case 'replaceExercise':
      return {
        ...doc,
        exercises: doc.exercises.map((e) =>
          e.id === op.weId
            ? {
                ...e,
                exerciseId: op.exercise.id,
                exercise: op.exercise,
                targetReps: null,
                targetRepsMax: null,
                targetWeight: null,
                restSeconds: null,
                sets: [freshSet(op.setId, 1)],
              }
            : e,
        ),
      };
    case 'addSet':
      return {
        ...doc,
        exercises: doc.exercises.map((e) =>
          e.id === op.weId
            ? {
                ...e,
                sets: [
                  ...e.sets,
                  // ?? 0: ops encoladas por una versión anterior no traen arrastre
                  freshSet(op.setId, nextOrder(e.sets), {
                    weight: op.weight ?? 0,
                    reps: op.reps ?? 0,
                  }),
                ],
              }
            : e,
        ),
      };
    case 'updateWorkout':
      return {
        ...doc,
        ...(op.patch.title !== undefined ? { title: op.patch.title } : {}),
        ...(op.patch.note !== undefined ? { note: op.patch.note } : {}),
      };
    case 'setSuperset':
      return {
        ...doc,
        exercises: doc.exercises.map((e) =>
          e.id === op.weId ? { ...e, supersetGroup: op.group } : e,
        ),
      };
    case 'updateSet':
      return {
        ...doc,
        exercises: doc.exercises.map((e) => ({
          ...e,
          sets: e.sets.map((s) => (s.id === op.setId ? applyPatch(s, op.patch) : s)),
        })),
      };
    case 'removeSet':
      return {
        ...doc,
        exercises: doc.exercises.map((e) => ({
          ...e,
          sets: e.sets.filter((s) => s.id !== op.setId),
        })),
      };
    case 'reorderExercises':
      return { ...doc, exercises: reorder(doc.exercises, op.ids) };
    case 'reorderSets':
      return {
        ...doc,
        exercises: doc.exercises.map((e) =>
          e.id === op.weId ? { ...e, sets: reorder(e.sets, op.ids) } : e,
        ),
      };
    default:
      return doc;
  }
}
