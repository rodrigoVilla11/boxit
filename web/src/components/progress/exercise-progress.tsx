'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUnit } from '@/components/unit-provider';
import { kgToDisplay, roundDisplay, unitLabel, weightValue } from '@/lib/units';
import { formatSessionDate } from '@/lib/format';
import { epley1RM } from '@/lib/prs';
import { getExerciseHistory, type ExerciseHistoryPoint } from '@/lib/progress';
import { ExerciseHistorySheet } from './exercise-history-sheet';

export type ExerciseOption = { exerciseId: string; exerciseName: string };

const W = 340;
const H = 150;
const PADX = 12;
const TOP = 14;
const BASE = 128;

const RANGES: { label: string; days: number }[] = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'Todo', days: 0 },
];

export function ExerciseProgress({ exercises }: { exercises: ExerciseOption[] }) {
  const { unit } = useUnit();
  const [exId, setExId] = useState(exercises[0]?.exerciseId ?? '');
  const [days, setDays] = useState(0);
  const [useE1rm, setUseE1rm] = useState(false);
  const [points, setPoints] = useState<ExerciseHistoryPoint[] | null>(null);
  const [sel, setSel] = useState(-1);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!exId) return;
    setPoints(null);
    getExerciseHistory(exId, days)
      .then((p) => {
        setPoints(p);
        setSel(p.length - 1);
      })
      .catch(() => setPoints([]));
  }, [exId, days]);

  const metric = points && points.length ? points[0].metric : 'weight';
  // La métrica se calcula por sesión: sólo ofrecemos 1RM si toda la serie es con carga.
  const homogeneous =
    !!points && points.length > 0 && points.every((p) => p.metric === metric);
  const e1rm = useE1rm && homogeneous && metric === 'weight';

  // valor "crudo" del punto (kg para peso; reps para peso corporal)
  const rawValue = (p: ExerciseHistoryPoint) =>
    e1rm ? epley1RM(p.value, p.reps) : p.value;
  // Escala al display según la métrica DEL punto (evita mezclar kg y reps mal).
  const toDisplay = (p: ExerciseHistoryPoint, v: number) =>
    p.metric === 'weight' ? roundDisplay(kgToDisplay(v, unit)) : v;
  const valueLabel = (p: ExerciseHistoryPoint) => {
    if (p.metric !== 'weight') return `${p.value} reps`;
    const v = weightValue(rawValue(p), unit);
    return `${e1rm ? '1RM ~' : ''}${v} ${unitLabel(unit)}`;
  };

  const geo = useMemo(() => {
    const pts = points ?? [];
    const ys = pts.map((p) => toDisplay(p, rawValue(p)));
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
  }, [points, unit, e1rm]);

  if (exercises.length === 0) return null;

  const exName =
    exercises.find((e) => e.exerciseId === exId)?.exerciseName ?? 'Ejercicio';
  const line = geo.pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${geo.x(i)},${geo.y(toDisplay(p, rawValue(p)))}`)
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
            className="max-w-[11rem] appearance-none truncate rounded-xl bg-surfaceRaised py-1.5 pl-3 pr-8 text-sm text-text outline-none focus:ring-2 focus:ring-primary"
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

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-surfaceRaised p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                days === r.days ? 'bg-primary text-ink' : 'text-textMuted hover:text-text',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        {homogeneous && metric === 'weight' && (
          <button
            type="button"
            onClick={() => setUseE1rm((v) => !v)}
            aria-pressed={e1rm}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95',
              e1rm
                ? 'bg-accentLime/15 text-accentLime'
                : 'bg-surfaceRaised text-textMuted hover:text-text',
            )}
          >
            1RM estimado
          </button>
        )}
      </div>

      {points === null ? (
        <div className="flex justify-center py-10 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : geo.pts.length === 0 ? (
        <p className="py-8 text-center text-sm text-textMuted">
          Sin registros en este período.
        </p>
      ) : (
        <>
          {selected && (
            <p className="mt-3 text-sm">
              <span className="font-display font-semibold text-primary">
                {valueLabel(selected)}
              </span>
              <span className="ml-2 text-xs text-textMuted">
                {formatSessionDate(selected.date)}
              </span>
            </p>
          )}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mt-2 w-full"
            role="img"
            aria-label="Progresión del ejercicio"
          >
            <line
              x1={PADX}
              y1={BASE}
              x2={W - PADX}
              y2={BASE}
              stroke="#8A938F"
              strokeOpacity={0.2}
              strokeWidth={1}
            />
            {geo.pts.length > 1 && (
              <path
                d={line}
                fill="none"
                stroke="#22C55E"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {geo.pts.map((p, i) => {
              const isSel = i === idx;
              const cy = geo.y(toDisplay(p, rawValue(p)));
              return (
                <g
                  key={p.workoutId}
                  role="button"
                  tabIndex={0}
                  aria-label={`${valueLabel(p)}, ${formatSessionDate(p.date)}`}
                  onClick={() => setSel(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSel(i);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={geo.x(i)} cy={cy} r={13} fill="transparent" />
                  <circle
                    cx={geo.x(i)}
                    cy={cy}
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

      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surfaceRaised py-2.5 text-sm font-medium text-textMuted transition hover:text-text active:scale-[0.99]"
      >
        <History className="h-4 w-4" />
        Ver historial por sesión
      </button>

      {historyOpen && (
        <ExerciseHistorySheet
          exerciseId={exId}
          exerciseName={exName}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </section>
  );
}
