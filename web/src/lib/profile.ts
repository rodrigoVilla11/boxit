import type { Sex } from './auth';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otro' },
];

export const sexLabel = (s: Sex): string =>
  SEX_OPTIONS.find((o) => o.value === s)?.label ?? 'Otro';

/** Edad en años a partir de la fecha de nacimiento (YYYY-MM-DD). */
export function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  // todavía no cumplió este año
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

/** IMC = kg / m². null si falta algún dato. */
export function bmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  const value = weightKg / (m * m);
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

/** Categoría OMS del IMC (informativa, no diagnóstica). */
export function bmiLabel(value: number | null): string {
  if (value === null) return '';
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/** % de grasa localizado (coma decimal, como el resto de los números). */
export function formatBodyFat(pct: number | null | undefined): string {
  if (!pct) return '';
  return `${pct.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;
}

/** Masa magra a partir del peso y el % de grasa. */
export function leanMassKg(
  weightKg: number | null,
  bodyFatPct: number | null,
): number | null {
  if (!weightKg || !bodyFatPct) return null;
  return Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10;
}
