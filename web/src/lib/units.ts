export type WeightUnit = 'KG' | 'LB';

const LB_PER_KG = 2.2046226218;
const KG_PER_LB = 0.45359237;

export function unitLabel(unit: WeightUnit): string {
  return unit === 'LB' ? 'lb' : 'kg';
}

/** kg (almacenado) → valor en la unidad de display. */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'LB' ? kg * LB_PER_KG : kg;
}

/** valor en la unidad de display → kg (para guardar). */
export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'LB' ? value * KG_PER_LB : value;
}

/** Redondeo de display: 1 decimal, sin .0 sobrante. */
export function roundDisplay(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Peso formateado con unidad. Ej: 100 kg → "100 kg" / "220.5 lb". */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${roundDisplay(kgToDisplay(kg, unit))} ${unitLabel(unit)}`;
}

/** Peso para un input (string), sin unidad; vacío si es 0. */
export function weightInputValue(kg: number, unit: WeightUnit): string {
  if (!kg) return '';
  return String(roundDisplay(kgToDisplay(kg, unit)));
}

/** Volumen (kg acumulados) formateado en la unidad, con separador de miles. */
export function formatVolume(kgVolume: number, unit: WeightUnit): string {
  const v = Math.round(kgToDisplay(kgVolume, unit));
  return `${v.toLocaleString('es-AR')} ${unitLabel(unit)}`;
}
