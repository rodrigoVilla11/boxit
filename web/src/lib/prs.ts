import { isPrEligible, type PersonalRecord, type WorkoutSet } from './workouts';

/** 1RM estimado (fórmula de Epley). Con 1 rep devuelve el peso tal cual. */
export function epley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/**
 * ¿La serie (valores en kg) es un récord para el ejercicio?
 * Estricta (a diferencia de la comparación por igualdad del historial):
 * - con carga: supera el mejor peso, o lo iguala con más reps
 * - peso corporal (weight 0): supera las mejores reps
 * - sin récord previo: primera serie de trabajo con reps > 0
 * - pasar de peso corporal a con carga cuenta como récord
 */
export function isNewPr(
  record: PersonalRecord | undefined,
  weightKg: number,
  reps: number,
): boolean {
  if (reps <= 0) return false;
  const hasWeight = weightKg > 0;
  if (!record) return true;
  if (record.metric === 'weight') {
    if (!hasWeight) return false;
    return (
      weightKg > record.weight ||
      (weightKg === record.weight && reps > record.reps)
    );
  }
  // récord por reps (peso corporal)
  if (hasWeight) return true;
  return reps > record.reps;
}

/**
 * Id de la mejor serie de trabajo completada que supera el récord base, o null.
 * Sirve para pintar una única insignia de récord por ejercicio en el entreno.
 */
export function bestPrSetId(
  sets: WorkoutSet[],
  record: PersonalRecord | undefined,
): string | null {
  const done = sets.filter(
    (s) => s.completed && isPrEligible(s.type) && s.reps > 0,
  );
  if (done.length === 0) return null;
  const withWeight = done.filter((s) => s.weight > 0);
  const pool = withWeight.length > 0 ? withWeight : done;
  const best = pool.reduce((a, b) =>
    b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a,
  );
  return isNewPr(record, best.weight, best.reps) ? best.id : null;
}

/**
 * Actualiza el récord en memoria tras batirlo, para no volver a festejar en la
 * misma sesión (el server recomputa los PRs al terminar el entreno).
 */
export function bumpRecord(
  record: PersonalRecord | undefined,
  exerciseId: string,
  exerciseName: string,
  weightKg: number,
  reps: number,
): PersonalRecord {
  const metric: 'weight' | 'reps' =
    weightKg > 0 ? 'weight' : record?.metric ?? 'reps';
  return {
    exerciseId,
    exerciseName,
    metric,
    weight: weightKg,
    reps,
    workoutId: record?.workoutId ?? '',
    achievedAt: null,
  };
}
