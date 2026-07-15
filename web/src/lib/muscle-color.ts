// Escala secuencial (magnitud) para el mapa de músculos: un solo hue verde,
// de tenue a intenso, con lima en el máximo. Músculo no entrenado = base.

export const MUSCLE_BASE = '#242B29';

const STOPS: { t: number; c: [number, number, number] }[] = [
  { t: 0, c: [27, 77, 46] }, // verde tenue
  { t: 0.55, c: [34, 197, 94] }, // verde BOX iT
  { t: 1, c: [163, 230, 53] }, // lima
];

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

function ramp(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < STOPS.length - 2 && x > STOPS[i + 1].t) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const local = b.t === a.t ? 0 : (x - a.t) / (b.t - a.t);
  const r = lerp(a.c[0], b.c[0], local);
  const g = lerp(a.c[1], b.c[1], local);
  const bl = lerp(a.c[2], b.c[2], local);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Color de un músculo según sus series relativas al máximo. */
export function muscleColor(sets: number, maxSets: number): string {
  if (sets <= 0) return MUSCLE_BASE;
  return ramp(maxSets > 0 ? sets / maxSets : 0);
}
