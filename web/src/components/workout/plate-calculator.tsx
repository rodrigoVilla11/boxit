'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useUnit } from '@/components/unit-provider';
import { useLockBody } from '@/hooks/use-lock-body';
import { cn } from '@/lib/cn';
import {
  displayToKg,
  kgToDisplay,
  roundDisplay,
  unitLabel,
} from '@/lib/units';
import { computePlates, defaultBar, defaultPlates } from '@/lib/plates';

const BAR_OPTIONS_KG = [20, 15, 10];
const BAR_OPTIONS_LB = [45, 35, 25];

export function PlateCalculator({
  weightKg,
  onClose,
}: {
  weightKg: number;
  onClose: () => void;
}) {
  const { unit } = useUnit();
  useLockBody(true);
  const step = unit === 'LB' ? 5 : 2.5;
  const barOptions = unit === 'LB' ? BAR_OPTIONS_LB : BAR_OPTIONS_KG;

  const [target, setTarget] = useState<number>(() =>
    roundDisplay(kgToDisplay(weightKg, unit)) || defaultBar(unit),
  );
  const [bar, setBar] = useState<number>(() => defaultBar(unit));

  const result = useMemo(
    () => computePlates(target, bar, defaultPlates(unit)),
    [target, bar, unit],
  );

  // Agrupa discos por peso para el resumen "por lado"
  const grouped = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of result.perSide) m.set(p, (m.get(p) ?? 0) + 1);
    return [...m.entries()]; // ya viene de mayor a menor
  }, [result.perSide]);

  const maxPlate = Math.max(...defaultPlates(unit));
  const u = unitLabel(unit);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calculadora de discos"
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            Calculadora de discos
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-8 pt-6">
        {/* Peso objetivo */}
        <div>
          <label className="mb-2 block text-sm font-medium text-textMuted">
            Peso total
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Restar"
              onClick={() => setTarget((t) => Math.max(0, roundDisplay(t - step)))}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-text active:scale-95"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-baseline justify-center gap-1 rounded-2xl bg-surfaceRaised py-2">
              <span className="font-display text-3xl font-bold tabular-nums text-text">
                {roundDisplay(target)}
              </span>
              <span className="text-sm text-textMuted">{u}</span>
            </div>
            <button
              type="button"
              aria-label="Sumar"
              onClick={() => setTarget((t) => roundDisplay(t + step))}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-text active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Barra */}
        <div>
          <label className="mb-2 block text-sm font-medium text-textMuted">
            Barra
          </label>
          <div className="flex gap-1 rounded-2xl bg-surface p-1">
            {barOptions.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBar(b)}
                aria-pressed={bar === b}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
                  bar === b ? 'bg-primary text-ink' : 'text-textMuted hover:text-text',
                )}
              >
                {b} {u}
              </button>
            ))}
          </div>
        </div>

        {/* Visual de la barra con discos (un lado) */}
        <div>
          <p className="mb-2 text-center text-xs uppercase tracking-wider text-textMuted">
            Cada lado
          </p>
          <div className="flex h-40 items-center justify-center gap-[3px] rounded-2xl bg-surface px-4">
            {/* mango de la barra */}
            <div className="h-2 w-8 rounded-l bg-textMuted/40" />
            {result.perSide.length === 0 ? (
              <span className="px-3 text-sm text-textMuted">Solo la barra</span>
            ) : (
              result.perSide.map((p, i) => {
                const h = 40 + Math.round((p / maxPlate) * 100); // 40–140px
                return (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className="flex w-7 items-center justify-center rounded bg-primary/80 text-[10px] font-bold text-ink"
                  >
                    {p}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resumen por lado */}
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm font-medium text-text">Por lado</p>
          {grouped.length === 0 ? (
            <p className="mt-1 text-sm text-textMuted">Sin discos.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {grouped.map(([p, n]) => (
                <span
                  key={p}
                  className="rounded-full bg-surfaceRaised px-3 py-1 text-sm font-semibold text-text"
                >
                  {p} {u} {n > 1 && <span className="text-textMuted">×{n}</span>}
                </span>
              ))}
            </div>
          )}
          {result.leftover > 0 && (
            <p className="mt-3 text-xs text-textMuted">
              No entra exacto: con estos discos armás{' '}
              {roundDisplay(result.achievable)} {u} (faltan{' '}
              {roundDisplay(result.leftover)} {u}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
