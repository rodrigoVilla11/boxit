import type { WeightUnit } from './units';

// Discos disponibles por lado (estándar) y barra, según la unidad.
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
export const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
export const BAR_KG = 20;
export const BAR_LB = 45;

export function defaultPlates(unit: WeightUnit): number[] {
  return unit === 'LB' ? PLATES_LB : PLATES_KG;
}
export function defaultBar(unit: WeightUnit): number {
  return unit === 'LB' ? BAR_LB : BAR_KG;
}

export type PlateResult = {
  perSide: number[]; // discos por lado, de mayor a menor
  achievable: number; // peso total realmente representable
  leftover: number; // lo que faltó para el objetivo (0 si es exacto)
};

/**
 * Descompone un peso total (objetivo) en discos por lado, greedy de mayor a
 * menor. Todo en la MISMA unidad (la barra, los discos y el objetivo).
 */
export function computePlates(
  targetTotal: number,
  bar: number,
  plates: number[],
): PlateResult {
  const perSideTarget = Math.max(0, (targetTotal - bar) / 2);
  const sorted = [...plates].sort((a, b) => b - a);
  const perSide: number[] = [];
  let remaining = perSideTarget;
  const EPS = 1e-6;
  for (const p of sorted) {
    while (remaining + EPS >= p) {
      perSide.push(p);
      remaining -= p;
    }
  }
  const usedPerSide = perSide.reduce((a, b) => a + b, 0);
  const achievable = bar + usedPerSide * 2;
  return {
    perSide,
    achievable,
    leftover: Math.max(0, targetTotal - achievable),
  };
}
