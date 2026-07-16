'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';

const WEEKS = 13;
const DAY = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
// lunes de la semana de `d`, a medianoche
function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - dow);
  return x;
}
const dayKey = (d: Date) => Math.floor(startOfDay(d).getTime() / DAY);

export function CalendarHeatmap() {
  const [history, setHistory] = useState<WorkoutSummary[] | null>(null);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  const { columns, streak, total } = useMemo(() => {
    const perDay = new Map<number, number>();
    const trainedWeeks = new Set<number>();
    for (const w of history ?? []) {
      if (!w.finishedAt) continue;
      const d = new Date(w.finishedAt);
      perDay.set(dayKey(d), (perDay.get(dayKey(d)) ?? 0) + 1);
      trainedWeeks.add(mondayOf(d).getTime());
    }

    const today = new Date();
    const thisMonday = mondayOf(today);
    const columns: { key: number; count: number; future: boolean }[][] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const col: { key: number; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(thisMonday.getTime() + (-w * 7 + d) * DAY);
        const future = startOfDay(cell) > startOfDay(today);
        col.push({
          key: dayKey(cell),
          count: future ? 0 : perDay.get(dayKey(cell)) ?? 0,
          future,
        });
      }
      columns.push(col);
    }

    // racha: semanas consecutivas con ≥1 entreno (la semana actual puede estar
    // vacía sin cortar la racha)
    let streak = 0;
    let w = trainedWeeks.has(thisMonday.getTime()) ? 0 : 1;
    while (trainedWeeks.has(thisMonday.getTime() - w * 7 * DAY)) {
      streak++;
      w++;
    }

    return { columns, streak, total: (history ?? []).length };
  }, [history]);

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text">Constancia</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accentLime/15 px-2.5 py-1 text-xs font-bold text-accentLime">
          <Flame className="h-3.5 w-3.5" />
          {streak} {streak === 1 ? 'semana' : 'semanas'}
        </span>
      </div>

      {history === null ? (
        <div className="flex justify-center py-8 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex justify-between gap-[3px]">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-1 flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.key}
                    className={cn(
                      'aspect-square rounded-[3px]',
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
            ))}
          </div>
          <p className="mt-3 text-xs text-textMuted">
            {total} {total === 1 ? 'entreno' : 'entrenos'} · últimas {WEEKS} semanas
          </p>
        </>
      )}
    </section>
  );
}
