'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useUnit } from '@/components/unit-provider';
import { kgToDisplay, roundDisplay, unitLabel } from '@/lib/units';
import { formatSessionDate } from '@/lib/format';
import { getExerciseHistory, type ExerciseHistoryPoint } from '@/lib/progress';

export type ExerciseOption = { exerciseId: string; exerciseName: string };

const W = 340;
const H = 150;
const PADX = 12;
const TOP = 14;
const BASE = 128;

export function ExerciseProgress({ exercises }: { exercises: ExerciseOption[] }) {
  const { unit } = useUnit();
  const [exId, setExId] = useState(exercises[0]?.exerciseId ?? '');
  const [points, setPoints] = useState<ExerciseHistoryPoint[] | null>(null);
  const [sel, setSel] = useState(-1);

  useEffect(() => {
    if (!exId) return;
    setPoints(null);
    getExerciseHistory(exId)
      .then((p) => {
        setPoints(p);
        setSel(p.length - 1);
      })
      .catch(() => setPoints([]));
  }, [exId]);

  const metric = points && points.length ? points[0].metric : 'weight';
  const toDisplay = (v: number) =>
    metric === 'weight' ? roundDisplay(kgToDisplay(v, unit)) : v;
  const valueLabel = (v: number) =>
    metric === 'weight'
      ? `${roundDisplay(kgToDisplay(v, unit))} ${unitLabel(unit)}`
      : `${v} reps`;

  const geo = useMemo(() => {
    const pts = points ?? [];
    const ys = pts.map((p) => toDisplay(p.value));
    const rawMin = Math.min(...ys);
    const rawMax = Math.max(...ys);
    const span = rawMax - rawMin;
    const yMin = span === 0 ? Math.max(0, rawMin - 1) : rawMin - span * 0.15;
    const yMax = span === 0 ? rawMax + 1 : rawMax + span * 0.15;
    const range = yMax - yMin || 1;
    const x = (i: number) =>
      pts.length <= 1 ? W / 2 : PADX + (i / (pts.length - 1)) * (W - PADX * 2);
    const y = (v: number) => BASE - ((v - yMin) / range) * (BASE - TOP);
    return { pts, x, y };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, unit]);

  if (exercises.length === 0) return null;

  const line = geo.pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${geo.x(i)},${geo.y(toDisplay(p.value))}`)
    .join(' ');
  const idx = sel >= 0 && sel < geo.pts.length ? sel : geo.pts.length - 1;
  const selected = geo.pts[idx];

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-text">Progresión</h2>
        <div className="relative">
          <select
            value={exId}
            onChange={(e) => setExId(e.target.value)}
            className="appearance-none rounded-xl bg-surfaceRaised py-1.5 pl-3 pr-8 text-sm text-text outline-none focus:ring-2 focus:ring-primary"
          >
            {exercises.map((e) => (
              <option key={e.exerciseId} value={e.exerciseId}>
                {e.exerciseName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
        </div>
      </div>

      {points === null ? (
        <div className="flex justify-center py-10 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : geo.pts.length === 0 ? (
        <p className="py-8 text-center text-sm text-textMuted">
          Sin registros de este ejercicio.
        </p>
      ) : (
        <>
          {selected && (
            <p className="mt-1 text-sm">
              <span className="font-display font-semibold text-primary">
                {valueLabel(selected.value)}
              </span>
              <span className="ml-2 text-xs text-textMuted">
                {formatSessionDate(selected.date)}
              </span>
            </p>
          )}
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Progresión del ejercicio">
            <line x1={PADX} y1={BASE} x2={W - PADX} y2={BASE} stroke="#8A938F" strokeOpacity={0.2} strokeWidth={1} />
            {geo.pts.length > 1 && (
              <path d={line} fill="none" stroke="#22C55E" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            )}
            {geo.pts.map((p, i) => {
              const isSel = i === idx;
              return (
                <g key={p.workoutId} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
                  <circle cx={geo.x(i)} cy={geo.y(toDisplay(p.value))} r={9} fill="transparent" />
                  <circle
                    cx={geo.x(i)}
                    cy={geo.y(toDisplay(p.value))}
                    r={isSel ? 5 : 3.5}
                    fill={isSel ? '#A3E635' : '#22C55E'}
                    stroke="#151A19"
                    strokeWidth={isSel ? 2 : 0}
                  />
                </g>
              );
            })}
          </svg>
        </>
      )}
    </section>
  );
}
