import type { WeightUnit } from './units';

// Discos disponibles por lado (estándar) y barra, según la unidad.
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
export const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
export const BAR_KG = 20;
export const BAR_LB = 45;

// Mancuernas fijas típicas de gimnasio (ascendente).
export const DUMBBELLS_KG = [
  1, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 8, 9, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30,
  32.5, 35, 37.5, 40, 45, 50,
];
export const DUMBBELLS_LB = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
  110, 120,
];

export function defaultPlates(unit: WeightUnit): number[] {
  return unit === 'LB' ? PLATES_LB : PLATES_KG;
}
export function defaultBar(unit: WeightUnit): number {
  return unit === 'LB' ? BAR_LB : BAR_KG;
}
export function defaultDumbbells(unit: WeightUnit): number[] {
  return unit === 'LB' ? DUMBBELLS_LB : DUMBBELLS_KG;
}

// ── Barras con nombre ───────────────────────────────────────────────────────
// El tipo de barra es solo del simulador: no se guarda en el ejercicio ni en la
// serie, es para poder corroborar cómo armar el peso.

export type BarOption = { id: string; label: string; weight: number };

const BARS_KG: BarOption[] = [
  { id: 'olympic', label: 'Olímpica', weight: 20 },
  { id: 'olympic-w', label: 'Olímpica W', weight: 15 },
  { id: 'ez', label: 'Z / EZ', weight: 10 },
  { id: 'short', label: 'Corta', weight: 5 },
  { id: 'none', label: 'Sin barra', weight: 0 },
];
const BARS_LB: BarOption[] = [
  { id: 'olympic', label: 'Olímpica', weight: 45 },
  { id: 'olympic-w', label: 'Olímpica W', weight: 35 },
  { id: 'ez', label: 'Z / EZ', weight: 25 },
  { id: 'short', label: 'Corta', weight: 10 },
  { id: 'none', label: 'Sin barra', weight: 0 },
];

export function barOptions(unit: WeightUnit): BarOption[] {
  return unit === 'LB' ? BARS_LB : BARS_KG;
}

const BAR_PREF_KEY = 'boxit_bar_id';

/** Última barra elegida (preferencia del simulador, no del ejercicio). */
export function readBarPref(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(BAR_PREF_KEY);
  } catch {
    return null;
  }
}
export function saveBarPref(id: string): void {
  try {
    window.localStorage.setItem(BAR_PREF_KEY, id);
  } catch {
    /* localStorage lleno o bloqueado: seguimos sin persistir */
  }
}

// ── Modo de armado ──────────────────────────────────────────────────────────

export type LoadMode = 'BARBELL' | 'DUMBBELL';

/** Modo sugerido según el `equipment` del ejercicio. Es solo el valor inicial. */
export function modeForEquipment(equipment?: string | null): LoadMode {
  return equipment === 'BARBELL' ? 'BARBELL' : 'DUMBBELL';
}

// ── Combinaciones de discos ─────────────────────────────────────────────────

// Trabajamos en centésimos para no arrastrar error de punto flotante (1,25 → 125).
const SCALE = 100;
const toI = (n: number) => Math.round(n * SCALE);
const round2 = (n: number) => Math.round(n * 100) / 100;

export type PlateCombo = {
  perSide: number[]; // discos de un lado, de mayor a menor
  count: number; // discos por lado
  distinct: number; // cuántos tamaños distintos usa
};

// Qué tan cómoda es una combinación: pocos discos y pocos tamaños distintos.
// Cada tamaño extra "cuesta" como disco y medio, así que 15+5 gana contra 2,5×8.
const comfort = (count: number, distinct: number) => count + 1.5 * (distinct - 1);

/**
 * Todas las formas exactas de armar `perSideTarget` con los discos dados,
 * ordenadas de la más cómoda de cargar a la menos (1×20, 2×10, 15+5, 4×5…).
 */
export function plateCombos(
  perSideTarget: number,
  plates: number[],
  opts: { maxPlates?: number; maxResults?: number } = {},
): PlateCombo[] {
  const maxPlates = opts.maxPlates ?? 8;
  const maxResults = opts.maxResults ?? 6;
  const target = toI(perSideTarget);
  if (target <= 0 || plates.length === 0) return [];

  const sizes = [...new Set(plates.map(toI))].sort((a, b) => b - a);
  const found: number[][] = [];
  let budget = 200_000; // techo de exploración por si el objetivo es enorme

  const walk = (rest: number, from: number, path: number[]) => {
    if (budget-- <= 0) return;
    if (rest === 0) {
      found.push([...path]);
      return;
    }
    if (path.length >= maxPlates) return;
    for (let i = from; i < sizes.length; i++) {
      const p = sizes[i];
      if (p > rest) continue;
      // Ni llenando los slots que quedan con este disco llegamos; los que siguen
      // son más chicos, así que cortamos la rama entera.
      if (p * (maxPlates - path.length) < rest) return;
      path.push(p);
      walk(rest - p, i, path); // `i` (no `i+1`): se puede repetir el mismo disco
      path.pop();
      if (found.length >= 4000 || budget <= 0) return;
    }
  };
  walk(target, 0, []);

  return found
    .map((perSide) => ({
      perSide: perSide.map((p) => p / SCALE),
      count: perSide.length,
      distinct: new Set(perSide).size,
    }))
    .sort(
      (a, b) =>
        comfort(a.count, a.distinct) - comfort(b.count, b.distinct) ||
        (b.perSide[0] ?? 0) - (a.perSide[0] ?? 0),
    )
    .slice(0, maxResults);
}

/**
 * Pesos totales exactos más cercanos por debajo y por arriba, cuando el
 * objetivo no se puede armar con los discos disponibles.
 */
export function nearestExactTotals(
  target: number,
  bar: number,
  plates: number[],
  maxPlates = 8,
): { below: number | null; above: number | null } {
  if (plates.length === 0) return { below: null, above: null };
  const stepI = toI(Math.min(...plates)) * 2; // granularidad del peso total
  const barI = toI(bar);
  const targetI = toI(target);
  const n = (targetI - barI) / stepI;

  const usable = (tI: number): boolean => {
    if (tI < barI) return false;
    if (tI === barI) return true; // solo la barra
    return (
      plateCombos((tI - barI) / 2 / SCALE, plates, { maxPlates, maxResults: 1 })
        .length > 0
    );
  };

  let below: number | null = null;
  const start = Math.floor(n);
  for (let k = start; k >= 0 && start - k < 40; k--) {
    const tI = barI + k * stepI;
    if (tI < targetI && usable(tI)) {
      below = tI / SCALE;
      break;
    }
  }

  let above: number | null = null;
  const from = Math.ceil(n);
  for (let k = from; k <= from + 40; k++) {
    const tI = barI + k * stepI;
    if (tI > targetI && usable(tI)) {
      above = tI / SCALE;
      break;
    }
  }

  return { below, above };
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

// ── Mancuernas ──────────────────────────────────────────────────────────────

export type DumbbellPlan = {
  count: 1 | 2;
  each: number; // peso de cada mancuerna
  total: number; // each × count
  exact: boolean; // el total da justo el objetivo
};

/**
 * Formas de llegar a `target` (peso TOTAL) con mancuernas fijas: dos iguales o
 * una sola. Si no hay tamaño exacto, propone el de abajo y el de arriba.
 */
export function dumbbellPlans(target: number, unit: WeightUnit): DumbbellPlan[] {
  const sizes = defaultDumbbells(unit);
  if (target <= 0) return [];
  const out: DumbbellPlan[] = [];
  const add = (count: 1 | 2, each: number) => {
    if (out.some((p) => p.count === count && p.each === each)) return;
    const total = round2(each * count);
    out.push({ count, each, total, exact: Math.abs(total - target) < 1e-6 });
  };

  for (const count of [2, 1] as const) {
    const ideal = target / count;
    const hit = sizes.find((s) => Math.abs(s - ideal) < 1e-6);
    if (hit !== undefined) {
      add(count, hit);
      continue;
    }
    const below = [...sizes].reverse().find((s) => s < ideal);
    const above = sizes.find((s) => s > ideal);
    if (below !== undefined) add(count, below);
    if (above !== undefined) add(count, above);
  }

  out.sort(
    (a, b) =>
      Number(b.exact) - Number(a.exact) ||
      Math.abs(a.total - target) - Math.abs(b.total - target) ||
      b.count - a.count,
  );
  // Si hay alguna combinación exacta, las aproximadas solo hacen ruido.
  return out.some((p) => p.exact) ? out.filter((p) => p.exact) : out;
}
