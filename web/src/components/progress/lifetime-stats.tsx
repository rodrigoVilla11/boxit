'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUnit } from '@/components/unit-provider';
import { formatVolume } from '@/lib/units';
import { plural } from '@/lib/plural';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';
import { getActivities, type Activity } from '@/lib/activities';

const DAY = 86_400_000;

type Delta = { dir: 'up' | 'down'; text: string } | null;

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
    const now = Date.now();
    const weekAgo = now - 7 * DAY;
    const twoWeeksAgo = now - 14 * DAY;
    let volume = 0;
    let sets = 0;
    let weekSessions = 0;
    let weekVolume = 0;
    let prevSessions = 0;
    let prevVolume = 0;
    for (const w of h) {
      volume += w.totalVolume;
      sets += w.totalSets;
      const t = w.finishedAt ? new Date(w.finishedAt).getTime() : 0;
      if (t >= weekAgo) {
        weekSessions++;
        weekVolume += w.totalVolume;
      } else if (t >= twoWeeksAgo) {
        prevSessions++;
        prevVolume += w.totalVolume;
      }
    }
    // las actividades de cardio también son "sesiones de la semana"
    for (const act of a) {
      const t = new Date(act.performedAt).getTime();
      if (t >= weekAgo) weekSessions++;
      else if (t >= twoWeeksAgo) prevSessions++;
    }
    return {
      workouts: h.length,
      volume,
      sets,
      weekSessions,
      weekVolume,
      prevSessions,
      prevVolume,
    };
  }, [history, activities]);

  if (history === null || activities === null) return null;
  if (history.length === 0 && activities.length === 0) return null;

  // delta de sesiones: absoluto; de volumen: porcentaje (sólo si hubo semana previa)
  const sessionsDelta: Delta =
    stats.weekSessions === 0 && stats.prevSessions === 0
      ? null
      : diffDelta(stats.weekSessions - stats.prevSessions, '');
  const volumeDelta: Delta =
    stats.prevVolume > 0
      ? diffDelta(
          Math.round(((stats.weekVolume - stats.prevVolume) / stats.prevVolume) * 100),
          '%',
        )
      : null;

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-text">Resumen</h2>
        <span className="text-[11px] text-textMuted">vs. semana pasada</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Tile
          label="Esta semana"
          value={plural(stats.weekSessions, 'sesión', 'sesiones')}
          delta={sessionsDelta}
        />
        <Tile
          label="Volumen semanal"
          value={formatVolume(stats.weekVolume, unit)}
          delta={volumeDelta}
        />
        <Tile label="Entrenos totales" value={stats.workouts.toLocaleString('es-AR')} />
        <Tile label="Series totales" value={stats.sets.toLocaleString('es-AR')} />
        <div className="col-span-2">
          <Tile label="Volumen total" value={formatVolume(stats.volume, unit)} />
        </div>
      </div>
    </section>
  );
}

/** Delta con signo; null si es 0 (no aporta como "tendencia"). */
function diffDelta(diff: number, suffix: string): Delta {
  if (diff === 0) return null;
  return { dir: diff > 0 ? 'up' : 'down', text: `${diff > 0 ? '+' : ''}${diff}${suffix}` };
}

function Tile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: Delta;
}) {
  return (
    <div className="rounded-xl bg-surfaceRaised px-3 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums',
              delta.dir === 'up' ? 'text-primary' : 'text-danger',
            )}
          >
            {delta.dir === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {delta.text}
          </span>
        )}
      </div>
      <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}
