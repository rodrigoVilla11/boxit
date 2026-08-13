'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dayKey, mondayOf, WEEKDAY_LABELS } from '@/lib/week';
import type { DayCompletion, SessionStatus } from '@/lib/session-completion';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Las 6 semanas visibles de un mes (empezando lunes). */
export function monthGridRange(month: Date): { start: Date; end: Date } {
  const start = mondayOf(new Date(month.getFullYear(), month.getMonth(), 1));
  const end = new Date(start);
  end.setDate(end.getDate() + 41);
  return { start, end };
}

/** Color del puntito de una sesión programada según cómo terminó. */
const STATUS_DOT: Record<SessionStatus, string> = {
  done: 'bg-accentLime',
  madeUp: 'bg-accentLime',
  pending: 'bg-primary',
  missed: 'bg-textMuted/40',
};

const MAX_DOTS = 4;

export function MonthGrid({
  month,
  completion,
  selected,
  onSelect,
  onMonthChange,
}: {
  month: Date; // primer día del mes visible
  completion: Map<number, DayCompletion>; // por dayKey: programado vs. hecho
  selected: Date;
  onSelect: (d: Date) => void;
  onMonthChange: (m: Date) => void;
}) {
  const { start } = monthGridRange(month);
  const todayK = dayKey(new Date());
  const selectedK = dayKey(selected);

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="rounded-3xl bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() =>
            onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition hover:text-text active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-base font-semibold text-text">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() =>
            onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition hover:text-text active:scale-90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((l) => (
          <span
            key={l}
            className="py-1 text-center text-[10px] font-bold uppercase text-textMuted"
          >
            {l}
          </span>
        ))}
        {cells.map((d) => {
          const k = dayKey(d);
          const inMonth = d.getMonth() === month.getMonth();
          const day = completion.get(k);
          // un puntito por sesión programada (color según su estado) y luego los
          // "no agendado"; si sobran, el resto se recorta
          const dots = [
            ...(day?.outcomes ?? []).map((o) => ({
              key: o.session.id,
              className: STATUS_DOT[o.status],
            })),
            ...(day?.extras ?? []).map((e) => ({
              key: e.id,
              className: 'bg-accentLime/35',
            })),
          ].slice(0, MAX_DOTS);
          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(d)}
              aria-label={d.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              aria-pressed={k === selectedK}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition active:scale-95',
                k === selectedK
                  ? 'bg-primary/15 ring-1 ring-primary'
                  : k === todayK
                    ? 'bg-surfaceRaised ring-1 ring-primary/40'
                    : 'hover:bg-surfaceRaised',
                inMonth ? 'text-text' : 'text-textMuted/50',
              )}
            >
              <span className={cn('leading-none', k === todayK && 'font-bold text-primary')}>
                {d.getDate()}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {dots.map((dot) => (
                  <span
                    key={dot.key}
                    className={cn('h-1.5 w-1.5 rounded-full', dot.className)}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-textMuted">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Programado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accentLime" /> Cumplido
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accentLime/35" /> No agendado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-textMuted/40" /> Sin hacer
        </span>
      </div>
    </div>
  );
}
