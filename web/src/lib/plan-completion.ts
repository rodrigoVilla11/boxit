import { DAY, dayKey, mondayOf, startOfDay } from './week';
import type { WeeklyPlan } from './plans';
import type { WorkoutSummary } from './workouts';
import type { Activity } from './activities';

export type PlanCompletion = {
  doneCount: number; // días planificados (no futuros) cumplidos
  plannedCount: number; // días planificados no futuros (denominador)
  byDow: boolean[]; // por dow: true si el día planificado se cumplió
};

/**
 * Cumplimiento a nivel DÍA de la semana actual: un día "planificado" (con ≥1
 * ítem no-REST) está cumplido si hubo ≥1 sesión ese día (entreno terminado o
 * actividad). El denominador excluye días futuros. Timezone local (mismo
 * dayKey/mondayOf que la Constancia).
 */
export function computeCompletion(
  plan: WeeklyPlan | null | undefined,
  workouts: WorkoutSummary[],
  activities: Activity[],
): PlanCompletion {
  const perDay = new Set<number>();
  for (const w of workouts) if (w.finishedAt) perDay.add(dayKey(new Date(w.finishedAt)));
  for (const a of activities) perDay.add(dayKey(new Date(a.performedAt)));

  const monday = mondayOf(new Date());
  const today = startOfDay(new Date());
  const byDow: boolean[] = [];
  let doneCount = 0;
  let plannedCount = 0;

  for (let dow = 0; dow < 7; dow++) {
    const date = new Date(monday.getTime() + dow * DAY);
    const planned = plan
      ? plan.items.some((i) => i.dayOfWeek === dow && i.kind !== 'REST')
      : false;
    const done = perDay.has(dayKey(date));
    byDow[dow] = planned && done;
    if (planned && startOfDay(date) <= today) {
      plannedCount++;
      if (done) doneCount++;
    }
  }

  return { doneCount, plannedCount, byDow };
}
