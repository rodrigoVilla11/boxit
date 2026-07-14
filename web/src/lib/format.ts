/** Segundos → "mm:ss" o "h:mm:ss". */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Kg con separador de miles (es-AR). Ej: 1300 → "1.300 kg". */
export function formatVolume(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return `${rounded.toLocaleString('es-AR')} kg`;
}

/** Fecha corta legible (es-AR). */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });
}
