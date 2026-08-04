'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPlans, type WeeklyPlan } from '@/lib/plans';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';
import { getActivities, type Activity } from '@/lib/activities';
import { computeCompletion } from '@/lib/plan-completion';

export function PlanWeekProgress() {
  const [plan, setPlan] = useState<WeeklyPlan | null | undefined>(undefined);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    getPlans()
      .then((ps) => setPlan(ps.find((p) => p.active) ?? null))
      .catch(() => setPlan(null));
    getHistory().then(setWorkouts).catch(() => {});
    getActivities().then(setActivities).catch(() => {});
  }, []);

  const c = useMemo(
    () => computeCompletion(plan ?? null, workouts, activities),
    [plan, workouts, activities],
  );

  if (plan === undefined) return null; // cargando
  if (!plan || c.plannedCount === 0) return null;

  const pct = Math.round((c.doneCount / c.plannedCount) * 100);

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="min-w-0 truncate font-display text-base font-semibold text-text">
          Plan «{plan.name}»
        </h2>
        <span className="shrink-0 font-display text-base font-bold text-primary">
          {c.doneCount}/{c.plannedCount}
        </span>
      </div>
      <p className="text-sm text-textMuted">
        Cumpliste {c.doneCount} de {c.plannedCount}{' '}
        {c.plannedCount === 1 ? 'día' : 'días'} planificados esta semana.
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surfaceRaised">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}
