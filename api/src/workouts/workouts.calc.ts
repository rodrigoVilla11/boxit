// Lógica pura de cálculos de un entreno (sin dependencias de Nest/Prisma).
// Regla de negocio (criterio único, reusado por server y front):
// - VOLUMEN / series: cuentan las de trabajo (todo menos calentamiento) completadas.
// - RÉCORD: solo NORMAL o AL FALLO; el drop set (post-fatiga) no marca récord.

export type SetTypeLike = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';

/** ¿La serie suma al volumen / conteo? Todo menos el calentamiento. */
export function isVolumeSet(type: SetTypeLike): boolean {
  return type !== 'WARMUP';
}

/** ¿La serie es elegible para récord? Trabajo real (no calentamiento, no drop). */
export function isPrEligible(type: SetTypeLike): boolean {
  return type === 'NORMAL' || type === 'FAILURE';
}

function isWorkingCompleted(s: CalcSet): boolean {
  return s.completed && isVolumeSet(s.type);
}

export interface CalcSet {
  type: SetTypeLike;
  weight: number;
  reps: number;
  completed: boolean;
}

/** Volumen en kg = Σ (peso × reps) de las series de trabajo completadas. */
export function computeVolume(sets: CalcSet[]): number {
  return sets.reduce(
    (acc, s) => (isWorkingCompleted(s) ? acc + s.weight * s.reps : acc),
    0,
  );
}

/** Cantidad de series de trabajo completadas (warmups excluidos). */
export function countCompletedSets(sets: CalcSet[]): number {
  return sets.reduce((acc, s) => (isWorkingCompleted(s) ? acc + 1 : acc), 0);
}

/** 1RM estimado (fórmula de Epley). Con 1 rep devuelve el peso tal cual. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Duración en segundos entre inicio y fin (nunca negativa). */
export function computeDurationSec(startedAt: Date, finishedAt: Date): number {
  return Math.max(
    0,
    Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000),
  );
}

/** Totales de un entreno a partir de todas sus series. */
export function computeWorkoutTotals(sets: CalcSet[]): {
  totalVolume: number;
  totalSets: number;
} {
  return {
    totalVolume: computeVolume(sets),
    totalSets: countCompletedSets(sets),
  };
}
