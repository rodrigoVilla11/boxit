'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BodyDiagram } from './body-diagram';
import { cn } from '@/lib/cn';
import { muscleColor } from '@/lib/muscle-color';
import { muscleLabel } from '@/lib/labels';
import { getMuscleMap, type MuscleKey, type MuscleStat } from '@/lib/progress';

const RANGES = [7, 30, 90];

export function MuscleMap() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<MuscleStat[] | null>(null);

  useEffect(() => {
    setStats(null);
    getMuscleMap(days)
      .then(setStats)
      .catch(() => setStats([]));
  }, [days]);

  const scoreByMuscle = useMemo(() => {
    const m = new Map<MuscleKey, number>();
    (stats ?? []).forEach((s) => m.set(s.muscle, s.score));
    return m;
  }, [stats]);

  const maxScore = useMemo(
    () => (stats ?? []).reduce((max, s) => Math.max(max, s.score), 0),
    [stats],
  );

  const trained = useMemo(
    () => (stats ?? []).filter((s) => s.sets > 0).sort((a, b) => b.sets - a.sets),
    [stats],
  );

  const colorFor = (muscle: MuscleKey) =>
    muscleColor(scoreByMuscle.get(muscle) ?? 0, maxScore);

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text">Músculos</h2>
        <div className="flex gap-1 rounded-lg bg-surfaceRaised p-0.5">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                days === d ? 'bg-primary text-ink' : 'text-textMuted hover:text-text',
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {stats === null ? (
        <div className="flex justify-center py-10 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : maxScore === 0 ? (
        <p className="py-8 text-center text-sm text-textMuted">
          Todavía no hay datos. Terminá un entreno para ver qué músculos trabajaste.
        </p>
      ) : (
        <>
          <div className="flex items-start justify-center gap-4">
            <BodyDiagram view="front" colorFor={colorFor} label="Frente" />
            <BodyDiagram view="back" colorFor={colorFor} label="Espalda" />
          </div>

          {/* Leyenda de intensidad */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-textMuted">menos</span>
            <div
              className="h-2 flex-1 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, rgb(27,77,46), rgb(34,197,94), rgb(163,230,53))',
              }}
            />
            <span className="text-[11px] text-textMuted">más</span>
          </div>

          {/* Top músculos por series */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {trained.map((s) => (
              <span
                key={s.muscle}
                className="inline-flex items-center gap-1.5 rounded-full bg-surfaceRaised px-2.5 py-1 text-xs text-text"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorFor(s.muscle) }}
                />
                {muscleLabel(s.muscle)}
                <span className="text-textMuted">{s.sets}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
