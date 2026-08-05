'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useUnit } from '@/components/unit-provider';
import { formatVolume } from '@/lib/units';
import { muscleLabel } from '@/lib/labels';
import { getMuscleSeries, type MuscleWeek } from '@/lib/workouts';

const W = 340;
const H = 150;
const PAD_X = 8;
const TOP = 14;
const BASE = 128;

function barPath(x: number, top: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${top + h} L${x},${top + rr} Q${x},${top} ${x + rr},${top} L${
    x + w - rr
  },${top} Q${x + w},${top} ${x + w},${top + rr} L${x + w},${top + h} Z`;
}

function weekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'Esta semana';
  if (weeksAgo === 1) return 'Semana pasada';
  return `Hace ${weeksAgo} semanas`;
}

export function MuscleVolumeChart() {
  const { unit } = useUnit();
  const [series, setSeries] = useState<MuscleWeek[] | null>(null);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    getMuscleSeries(8)
      .then(setSeries)
      .catch(() => setSeries([]));
  }, []);

  // músculos con volumen (ordenados por total desc) → sólo mostramos los entrenados
  const muscles = useMemo(() => {
    const totals = new Map<string, number>();
    for (const w of series ?? []) {
      for (const [m, v] of Object.entries(w.byMuscle)) {
        totals.set(m, (totals.get(m) ?? 0) + v);
      }
    }
    return [...totals.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);
  }, [series]);

  const active = muscle ?? muscles[0] ?? null;
  const values = useMemo(
    () => (series ?? []).map((w) => active ? w.byMuscle[active] ?? 0 : 0),
    [series, active],
  );
  const maxV = Math.max(0, ...values);

  if (series === null) return null;
  if (muscles.length === 0) return null;

  const slot = (W - PAD_X * 2) / values.length;
  const barW = Math.min(30, slot * 0.62);
  const idx = sel !== null && sel >= 0 && sel < values.length ? sel : values.length - 1;
  const selectedWeek = series[idx];

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-text">
          Volumen por músculo
        </h2>
        <div className="text-right">
          <span className="font-display text-sm font-semibold text-primary">
            {formatVolume(values[idx] ?? 0, unit)}
          </span>
          <span className="ml-2 text-xs text-textMuted">
            {weekLabel(selectedWeek?.weeksAgo ?? 0)}
          </span>
        </div>
      </div>

      {/* selector de músculo (scroll horizontal) */}
      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {muscles.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMuscle(m);
              setSel(null);
            }}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
              m === active
                ? 'bg-primary text-ink'
                : 'bg-surfaceRaised text-textMuted hover:text-text',
            )}
          >
            {muscleLabel(m)}
          </button>
        ))}
      </div>

      {maxV === 0 ? (
        <p className="py-6 text-center text-sm text-textMuted">
          Sin volumen con carga en {muscleLabel(active ?? '')} estas semanas.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-1 w-full"
          role="img"
          aria-label={`Volumen semanal de ${muscleLabel(active ?? '')}`}
        >
          <line
            x1={PAD_X}
            y1={BASE}
            x2={W - PAD_X}
            y2={BASE}
            stroke="#8A938F"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
          {values.map((v, i) => {
            const h = maxV > 0 ? (v / maxV) * (BASE - TOP) : 0;
            const x = PAD_X + slot * i + (slot - barW) / 2;
            const isSel = i === idx;
            return (
              <g key={i} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
                <rect x={PAD_X + slot * i} y={TOP} width={slot} height={BASE - TOP} fill="transparent" />
                {h > 0 && (
                  <path
                    d={barPath(x, BASE - h, barW, h, 4)}
                    fill={isSel ? '#A3E635' : '#22C55E'}
                    fillOpacity={isSel ? 1 : 0.55}
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
