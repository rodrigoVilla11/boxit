'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';
import { getActivities, type Activity } from '@/lib/activities';
import { DAY, WEEKDAY_LABELS, dayKey, mondayOf, startOfDay } from '@/lib/week';

const WEEKS = 13;

export function CalendarHeatmap() {
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

  const { rows, streak, total } = useMemo(() => {
    const perDay = new Map<number, number>();
    const trainedWeeks = new Set<number>();
    const mark = (iso: string | null | undefined) => {
      if (!iso) return;
      const d = new Date(iso);
      perDay.set(dayKey(d), (perDay.get(dayKey(d)) ?? 0) + 1);
      trainedWeeks.add(mondayOf(d).getTime());
    };
    // entrenos de gym + actividades de cardio cuentan igual para la constancia
    for (const w of history ?? []) mark(w.finishedAt);
    for (const a of activities ?? []) mark(a.performedAt);

    const today = new Date();
    const thisMonday = mondayOf(today);
    // una fila por semana (la más vieja arriba), y dentro de cada fila los días
    // de lunes a domingo: se lee de izquierda a derecha y de arriba hacia abajo
    const rows: { key: number; count: number; future: boolean }[][] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const row: { key: number; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(thisMonday);
        cell.setDate(cell.getDate() - w * 7 + d);
        const future = startOfDay(cell) > startOfDay(today);
        row.push({
          key: dayKey(cell),
          count: future ? 0 : perDay.get(dayKey(cell)) ?? 0,
          future,
        });
      }
      rows.push(row);
    }

    // racha: semanas consecutivas con ≥1 entreno (la semana actual puede estar
    // vacía sin cortar la racha)
    let streak = 0;
    let w = trainedWeeks.has(thisMonday.getTime()) ? 0 : 1;
    while (trainedWeeks.has(thisMonday.getTime() - w * 7 * DAY)) {
      streak++;
      w++;
    }

    const total = rows.flat().reduce((n, c) => n + (c.future ? 0 : c.count), 0);
    return { rows, streak, total };
  }, [history, activities]);

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text">Constancia</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accentLime/15 px-2.5 py-1 text-xs font-bold text-accentLime">
          <Flame className="h-3.5 w-3.5" />
          {streak} {streak === 1 ? 'semana' : 'semanas'}
        </span>
      </div>

      {history === null || activities === null ? (
        <div className="flex justify-center py-8 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-[3px]">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="mb-0.5 text-center text-[10px] font-medium text-textMuted"
              >
                {label[0]}
              </div>
            ))}
            {rows.flat().map((cell) => (
              <div
                key={cell.key}
                className={cn(
                  // rectángulos (no cuadrados): con 7 columnas y 13 filas, los
                  // cuadrados harían la tarjeta el doble de alta que el resto
                  'aspect-[2/1] rounded-[3px]',
                  cell.future
                    ? 'bg-transparent'
                    : cell.count === 0
                      ? 'bg-surfaceRaised'
                      : cell.count === 1
                        ? 'bg-primary/55'
                        : cell.count === 2
                          ? 'bg-primary/85'
                          : 'bg-accentLime',
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-textMuted">
            {total} {total === 1 ? 'sesión' : 'sesiones'} · últimas {WEEKS} semanas
          </p>
        </>
      )}
    </section>
  );
}
