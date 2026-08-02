'use client';

import { Check, ChevronRight, Dumbbell, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WEEKDAY_LABELS, todayDow } from '@/lib/week';
import { activityIcon, activityLabel, formatDistance } from '@/lib/activity';
import { formatDuration } from '@/lib/format';
import type { PlanItem, WeeklyPlan } from '@/lib/plans';

export function PlanWeek({
  plan,
  completion,
  onEditDay,
}: {
  plan: WeeklyPlan;
  completion?: boolean[]; // por dow: true si el día planificado se cumplió
  onEditDay: (day: number) => void;
}) {
  const today = todayDow();
  const byDay: PlanItem[][] = Array.from({ length: 7 }, () => []);
  for (const it of plan.items) byDay[it.dayOfWeek]?.push(it);

  return (
    <div className="space-y-1.5">
      {WEEKDAY_LABELS.map((label, dow) => {
        const items = byDay[dow];
        const isToday = dow === today;
        const planned = items.some((i) => i.kind !== 'REST');
        const done = planned && completion?.[dow];
        return (
          <button
            key={dow}
            type="button"
            onClick={() => onEditDay(dow)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99]',
              isToday ? 'bg-primary/10 ring-1 ring-primary/40' : 'bg-surface',
            )}
          >
            <div className="flex w-9 shrink-0 flex-col items-center">
              <span
                className={cn(
                  'text-xs font-bold uppercase',
                  isToday ? 'text-primary' : 'text-textMuted',
                )}
              >
                {label}
              </span>
              {done && <Check className="mt-0.5 h-3.5 w-3.5 text-primary" strokeWidth={3} />}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              {items.length === 0 ? (
                <span className="text-sm text-textMuted">Sin plan</span>
              ) : (
                items.map((it) => <ItemLine key={it.id} it={it} />)
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-textMuted" />
          </button>
        );
      })}
    </div>
  );
}

function ItemLine({ it }: { it: PlanItem }) {
  if (it.kind === 'REST') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-textMuted">
        <Moon className="h-3.5 w-3.5" />
        Descanso
      </span>
    );
  }
  if (it.kind === 'ROUTINE') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-text">
        <Dumbbell className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate">{it.routine?.name ?? 'Rutina eliminada'}</span>
      </span>
    );
  }
  // ACTIVITY
  const Icon = it.activityType ? activityIcon(it.activityType) : Dumbbell;
  const target = [
    it.targetDistanceM && it.activityType
      ? formatDistance(it.targetDistanceM, it.activityType)
      : '',
    it.targetDurationSec ? formatDuration(it.targetDurationSec) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <span className="flex items-center gap-1.5 text-sm text-text">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">
        {it.activityType ? activityLabel(it.activityType) : 'Cardio'}
        {target && <span className="text-textMuted"> · {target}</span>}
      </span>
    </span>
  );
}
