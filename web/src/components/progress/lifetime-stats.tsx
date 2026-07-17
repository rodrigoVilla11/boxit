'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUnit } from '@/components/unit-provider';
import { formatVolume } from '@/lib/units';
import { plural } from '@/lib/plural';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';

const DAY = 86_400_000;

export function LifetimeStats() {
  const { unit } = useUnit();
  const [history, setHistory] = useState<WorkoutSummary[] | null>(null);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  const stats = useMemo(() => {
    const h = history ?? [];
    const since = Date.now() - 7 * DAY;
    let volume = 0;
    let sets = 0;
    let weekCount = 0;
    let weekVolume = 0;
    for (const w of h) {
      volume += w.totalVolume;
      sets += w.totalSets;
      if (w.finishedAt && new Date(w.finishedAt).getTime() >= since) {
        weekCount++;
        weekVolume += w.totalVolume;
      }
    }
    return { workouts: h.length, volume, sets, weekCount, weekVolume };
  }, [history]);

  if (history === null || history.length === 0) return null;

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <h2 className="mb-3 font-display text-base font-semibold text-text">Resumen</h2>
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Esta semana" value={plural(stats.weekCount, 'entreno', 'entrenos')} />
        <Tile label="Volumen semanal" value={formatVolume(stats.weekVolume, unit)} />
        <Tile label="Entrenos totales" value={stats.workouts.toLocaleString('es-AR')} />
        <Tile label="Series totales" value={stats.sets.toLocaleString('es-AR')} />
        <div className="col-span-2">
          <Tile label="Volumen total" value={formatVolume(stats.volume, unit)} />
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surfaceRaised px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}
