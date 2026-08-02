// Helpers de día/semana en timezone LOCAL, compartidos por el calendario de
// constancia y el cumplimiento del plan (para que cuenten los mismos días).

export const DAY = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Lunes de la semana de `d`, a medianoche local. */
export function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - dow);
  return x;
}

/** Índice de día absoluto (para agrupar sesiones por fecha local). */
export const dayKey = (d: Date): number =>
  Math.floor(startOfDay(d).getTime() / DAY);

/** Día de la semana de hoy, 0 = lunes .. 6 = domingo. */
export const todayDow = (): number => (new Date().getDay() + 6) % 7;

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAY_FULL = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];
