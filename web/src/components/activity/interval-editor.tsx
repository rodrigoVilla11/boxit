'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import type { ActivityIntervalInput } from '@/lib/activities';

/**
 * Editor de intervalos compartido: lo usan el registro de una actividad y las
 * plantillas de cardio (misma prescripción: reps × distancia|tiempo + descanso).
 */
export type IntervalRow = {
  key: string;
  reps: number;
  label: string;
  distanceM: string; // metros, por repetición
  durationSec: string; // segundos, por repetición
  restSec: string; // segundos
};

type IntervalLike = {
  label: string | null;
  reps: number;
  distanceM: number | null;
  durationSec: number | null;
  restSec: number | null;
};

let keySeq = 0;
const nextKey = (): string => `iv${keySeq++}`;

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const intOrNull = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const newIntervalRow = (): IntervalRow => ({
  key: nextKey(),
  reps: 1,
  label: '',
  distanceM: '',
  durationSec: '',
  restSec: '',
});

export function intervalRows(intervals: IntervalLike[] | undefined): IntervalRow[] {
  return (intervals ?? []).map((iv) => ({
    key: nextKey(),
    reps: iv.reps,
    label: iv.label ?? '',
    distanceM: iv.distanceM ? String(iv.distanceM) : '',
    durationSec: iv.durationSec ? String(iv.durationSec) : '',
    restSec: iv.restSec ? String(iv.restSec) : '',
  }));
}

export function toIntervalInputs(rows: IntervalRow[]): ActivityIntervalInput[] {
  return rows.map((r) => ({
    label: r.label.trim() || null,
    reps: Math.max(1, Math.round(r.reps)),
    distanceM: intOrNull(r.distanceM),
    durationSec: intOrNull(r.durationSec),
    restSec: intOrNull(r.restSec),
  }));
}

/** Totales que resultan de los intervalos (reps × valor por repetición). */
export function intervalTotals(rows: IntervalRow[]): {
  distanceM: number;
  durationSec: number;
} {
  let distanceM = 0;
  let durationSec = 0;
  for (const r of rows) {
    distanceM += r.reps * num(r.distanceM);
    durationSec += r.reps * num(r.durationSec);
  }
  return { distanceM, durationSec };
}

export function IntervalEditor({
  rows,
  onChange,
  action,
}: {
  rows: IntervalRow[];
  onChange: (rows: IntervalRow[]) => void;
  // acción opcional al lado del título (ej: "Sumar a totales")
  action?: React.ReactNode;
}) {
  const patch = (key: string, p: Partial<IntervalRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const remove = (key: string) => onChange(rows.filter((r) => r.key !== key));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-textMuted">Intervalos</h3>
        {rows.length > 0 && action}
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="rounded-2xl bg-surface p-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-surfaceRaised p-1">
                <button
                  type="button"
                  aria-label="Menos repeticiones"
                  onClick={() => patch(r.key, { reps: Math.max(1, r.reps - 1) })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums text-text">
                  {r.reps}
                </span>
                <button
                  type="button"
                  aria-label="Más repeticiones"
                  onClick={() => patch(r.key, { reps: Math.min(200, r.reps + 1) })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-textMuted">×</span>
              <input
                value={r.label}
                onChange={(e) => patch(r.key, { label: e.target.value })}
                placeholder="Etiqueta"
                aria-label="Etiqueta del intervalo"
                maxLength={40}
                className="h-9 min-w-0 flex-1 rounded-lg bg-surfaceRaised px-3 text-sm text-text outline-none placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => remove(r.key)}
                aria-label="Quitar intervalo"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-textMuted transition hover:text-danger active:scale-90"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <IvField
                label="Dist. (m)"
                value={r.distanceM}
                onChange={(v) => patch(r.key, { distanceM: v })}
              />
              <IvField
                label="Tiempo (s)"
                value={r.durationSec}
                onChange={(v) => patch(r.key, { durationSec: v })}
              />
              <IvField
                label="Desc. (s)"
                value={r.restSec}
                onChange={(v) => patch(r.key, { restSec: v })}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, newIntervalRow()])}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/15 active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        Agregar intervalo
      </button>
    </div>
  );
}

function IvField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-textMuted">
        {label}
      </span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-label={label}
        className="h-10 w-full rounded-lg bg-surfaceRaised px-2 text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
