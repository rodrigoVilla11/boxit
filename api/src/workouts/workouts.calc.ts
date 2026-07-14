// Lógica pura de cálculos de un entreno (sin dependencias de Nest/Prisma).
// Regla de negocio: los warmups NO cuentan para volumen ni para series completadas
// (son de entrada en calor). Solo cuentan las series de trabajo (NORMAL) completadas.

export type SetTypeLike = 'NORMAL' | 'WARMUP';

export interface CalcSet {
  type: SetTypeLike;
  weight: number;
  reps: number;
  completed: boolean;
}

function isWorkingCompleted(s: CalcSet): boolean {
  return s.completed && s.type === 'NORMAL';
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
