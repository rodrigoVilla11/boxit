'use client';

import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLockBody } from '@/hooks/use-lock-body';
import { duplicateWeek } from '@/lib/schedule';
import { plural } from '@/lib/plural';

const fmt = (d: Date): string =>
  d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Sheet para copiar la semana seleccionada a las próximas N semanas. */
export function DuplicateWeekSheet({
  open,
  weekStart,
  sessionCount,
  onClose,
  onDone,
}: {
  open: boolean;
  weekStart: Date; // lunes de la semana origen
  sessionCount: number; // sesiones programadas en la semana origen
  onClose: () => void;
  onDone: (created: number) => void;
}) {
  const titleId = useId();
  const [weeks, setWeeks] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    setWeeks(1);
    setError(null);
  }, [open]);

  if (!open) return null;

  const from = addDays(weekStart, 7);
  const to = addDays(weekStart, 6 + 7 * weeks);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const created = await duplicateWeek(weekStart, weeks);
      onDone(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo duplicar la semana.');
      setPending(false);
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[75] flex items-end justify-center bg-black/60 px-4 pb-safe backdrop-blur-sm"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="app-shell animate-sheet-in mb-4 w-full rounded-3xl border border-white/10 bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-lg font-semibold text-text">
          Duplicar semana
        </h2>
        <p className="mt-1.5 text-sm text-textMuted">
          Copia las {plural(sessionCount, 'sesión', 'sesiones')} de la semana del{' '}
          {fmt(weekStart)} a las semanas siguientes.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text">Repetir por</span>
          <div className="flex items-center gap-1 rounded-xl bg-surfaceRaised p-1">
            <button
              type="button"
              onClick={() => setWeeks((w) => Math.max(1, w - 1))}
              aria-label="Menos semanas"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-20 text-center text-sm tabular-nums text-text">
              {plural(weeks, 'semana', 'semanas')}
            </span>
            <button
              type="button"
              onClick={() => setWeeks((w) => Math.min(26, w + 1))}
              aria-label="Más semanas"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
          Se van a programar {sessionCount * weeks}{' '}
          {sessionCount * weeks === 1 ? 'sesión' : 'sesiones'}, del {fmt(from)} al{' '}
          {fmt(to)}.
        </p>

        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={confirm} loading={pending}>
            Duplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
