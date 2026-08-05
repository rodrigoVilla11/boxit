import type { WorkoutExercise } from './workouts';

export type SupersetInfo = {
  letter: string | null; // A/B/C si está en una superserie (≥2 miembros); null si suelto
  position: 'solo' | 'first' | 'middle' | 'last';
  group: number | null;
};

/**
 * Deriva por ejercicio su letra de superserie y posición en el grupo. Sólo los
 * grupos con ≥2 miembros cuentan como superserie (uno solo = suelto). La letra
 * se asigna por orden de primera aparición del grupo. Asume que los miembros de
 * un grupo son contiguos (garantizado por "agrupar con el siguiente").
 */
export function supersetMap(
  exercises: WorkoutExercise[],
): Record<string, SupersetInfo> {
  const counts = new Map<number, number>();
  for (const e of exercises) {
    if (e.supersetGroup != null) {
      counts.set(e.supersetGroup, (counts.get(e.supersetGroup) ?? 0) + 1);
    }
  }
  const letters = new Map<number, string>();
  let n = 0;
  for (const e of exercises) {
    const g = e.supersetGroup;
    if (g != null && (counts.get(g) ?? 0) >= 2 && !letters.has(g)) {
      letters.set(g, String.fromCharCode(65 + n)); // A, B, C…
      n++;
    }
  }
  const out: Record<string, SupersetInfo> = {};
  exercises.forEach((e, i) => {
    const g = e.supersetGroup;
    const valid = g != null && (counts.get(g) ?? 0) >= 2;
    if (!valid) {
      out[e.id] = { letter: null, position: 'solo', group: g };
      return;
    }
    const prevSame = exercises[i - 1]?.supersetGroup === g;
    const nextSame = exercises[i + 1]?.supersetGroup === g;
    const position = !prevSame && nextSame
      ? 'first'
      : prevSame && nextSame
        ? 'middle'
        : prevSame && !nextSame
          ? 'last'
          : 'solo';
    out[e.id] = { letter: letters.get(g) ?? null, position, group: g };
  });
  return out;
}

/** Próximo id de grupo libre (máximo actual + 1). */
export function nextSupersetGroup(exercises: WorkoutExercise[]): number {
  let max = 0;
  for (const e of exercises) {
    if (e.supersetGroup != null && e.supersetGroup > max) max = e.supersetGroup;
  }
  return max + 1;
}
