'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUnit } from '@/components/unit-provider';
import { formatVolume } from '@/lib/units';
import { plural } from '@/lib/plural';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';
import { getActivities, type Activity } from '@/lib/activities';

const DAY = 86_400_000;

export function LifetimeStats() {
  const { unit } = useUnit();
  const [history, setHistory] = useState<WorkoutSummary[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
    getActivities()
      .then(setActivities)
      .catch(() => setActivities([]));
  }, []);

  const stats = useMemo(() => {
    const h = history ?? [];
    const a = activities ?? [];
    const since = Date.now() - 7 * DAY;
    let volume = 0;
    let sets = 0;
    let weekSessions = 0;
    let weekVolume = 0;
    for (const w of h) {
      volume += w.totalVolume;
      sets += w.totalSets;
      if (w.finishedAt && new Date(w.finishedAt).getTime() >= since) {
        weekSessions++;
        weekVolume += w.totalVolume;
      }
    }
    // las actividades de cardio también son "sesiones de la semana"
    for (const act of a) {
      if (new Date(act.performedAt).getTime() >= since) weekSessions++;
    }
    return { workouts: h.length, volume, sets, weekSessions, weekVolume };
  }, [history, activities]);

  if (history === null || activities === null) return null;
  if (history.length === 0 && activities.length === 0) return null;

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <h2 className="mb-3 font-display text-base font-semibold text-text">Resumen</h2>
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Esta semana" value={plural(stats.weekSessions, 'sesión', 'sesiones')} />
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
