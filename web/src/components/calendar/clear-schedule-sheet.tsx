'use client';

import { useEffect, useId, useState } from 'react';
import { CalendarX2, Eraser } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useLockBody } from '@/hooks/use-lock-body';
import { clearSchedule } from '@/lib/schedule';
import { startOfDay } from '@/lib/week';

type Scope = 'future' | 'all';

/**
 * Sheet para vaciar el calendario. "Desde hoy" es el default: el pasado queda
 * como registro de qué se planificó (y qué se cumplió); "Todo" borra también eso.
 */
export function ClearScheduleSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (deleted: number) => void;
}) {
  const titleId = useId();
  const [scope, setScope] = useState<Scope>('future');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    setScope('future');
    setError(null);
  }, [open]);

  if (!open) return null;

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const deleted = await clearSchedule(
        scope === 'future' ? startOfDay(new Date()) : undefined,
      );
      setPending(false);
      onDone(deleted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos limpiar el calendario.');
      setPending(false);
    }
  }

  const options: { value: Scope; icon: typeof Eraser; title: string; detail: string }[] = [
    {
      value: 'future',
      icon: Eraser,
      title: 'Desde hoy en adelante',
      detail: 'Lo pasado queda como registro de lo que planificaste.',
    },
    {
      value: 'all',
      icon: CalendarX2,
      title: 'Todo el calendario',
      detail: 'Borra también las sesiones programadas de días pasados.',
    },
  ];

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
          Limpiar calendario
        </h2>
        <p className="mt-1.5 text-sm text-textMuted">
          Se borran las sesiones programadas y los programas que queden vacíos.
          Tus entrenos y actividades ya registrados no se tocan.
        </p>

        <div className="mt-4 space-y-2">
          {options.map((o) => {
            const on = scope === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setScope(o.value)}
                aria-pressed={on}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99]',
                  on
                    ? 'bg-danger/10 ring-1 ring-danger/40'
                    : 'bg-surfaceRaised hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    on ? 'bg-danger/15 text-danger' : 'bg-surface text-textMuted',
                  )}
                >
                  <o.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">
                    {o.title}
                  </span>
                  <span className="block text-xs text-textMuted">{o.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} loading={pending}>
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  );
}
