import type { Exercise, SetPatch } from '../workouts';

// Intents que se aplican al doc local y se encolan para replay en el server.
// El store les inyecta `seq` (auto-increment) para ordenarlos y borrarlos.
export type Op =
  | { kind: 'start'; workoutId: string; ts: number }
  | {
      kind: 'addExercise';
      workoutId: string;
      weId: string;
      setId: string;
      exercise: Exercise;
      ts: number;
    }
  | { kind: 'removeExercise'; workoutId: string; weId: string; ts: number }
  | { kind: 'addSet'; workoutId: string; weId: string; setId: string; ts: number }
  | { kind: 'updateSet'; workoutId: string; setId: string; patch: SetPatch; ts: number }
  | { kind: 'removeSet'; workoutId: string; setId: string; ts: number }
  | { kind: 'reorderExercises'; workoutId: string; ids: string[]; ts: number }
  | { kind: 'reorderSets'; workoutId: string; weId: string; ids: string[]; ts: number }
  | { kind: 'finish'; workoutId: string; ts: number }
  | { kind: 'discard'; workoutId: string; ts: number };

export type QueuedOp = Op & { seq: number };
