'use client';

import { useState } from 'react';
import { Dumbbell, Moon, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import { WEEKDAY_FULL } from '@/lib/week';
import { formatDuration } from '@/lib/format';
import {
  ACTIVITY_TYPES,
  activityDistanceUnit,
  activityIcon,
  activityLabel,
  formatDistance,
} from '@/lib/activity';
import { updatePlan, type PlanItem, type PlanItemInput, type WeeklyPlan } from '@/lib/plans';
import type { ActivityType } from '@/lib/activities';
import type { Routine } from '@/lib/routines';

let keySeq = 0;
type Draft = {
  key: string;
  kind: 'ROUTINE' | 'ACTIVITY' | 'REST';
  routineId?: string;
  routineName?: string;
  activityType?: ActivityType;
  targetDistanceM?: number | null;
  targetDurationSec?: number | null;
};

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function toDraft(it: PlanItem): Draft {
  return {
    key: `k${keySeq++}`,
    kind: it.kind,
    routineId: it.routineId ?? undefined,
    routineName: it.routine?.name,
    activityType: it.activityType ?? undefined,
    targetDistanceM: it.targetDistanceM,
    targetDurationSec: it.targetDurationSec,
  };
}

function draftToInput(d: Draft, dayOfWeek: number): PlanItemInput {
  return {
    dayOfWeek,
    kind: d.kind,
    routineId: d.kind === 'ROUTINE' ? d.routineId : undefined,
    activityType: d.kind === 'ACTIVITY' ? d.activityType : undefined,
    targetDistanceM: d.kind === 'ACTIVITY' ? d.targetDistanceM ?? null : null,
    targetDurationSec: d.kind === 'ACTIVITY' ? d.targetDurationSec ?? null : null,
  };
}

export function DayEditor({
  plan,
  day,
  routines,
  onClose,
  onSaved,
}: {
  plan: WeeklyPlan;
  day: number;
  routines: Routine[];
  onClose: () => void;
  onSaved: (p: WeeklyPlan) => void;
}) {
  const toast = useToast();
  useLockBody(true);
  const [items, setItems] = useState<Draft[]>(() =>
    plan.items.filter((i) => i.dayOfWeek === day).map(toDraft),
  );
  const [saving, setSaving] = useState(false);

  // sub-form de cardio
  const [cType, setCType] = useState<ActivityType>('RUN');
  const [cDist, setCDist] = useState('');
  const [cMin, setCMin] = useState('');
  const cUnit = activityDistanceUnit(cType) ?? 'm';

  const add = (d: Omit<Draft, 'key'>) =>
    setItems((prev) => [...prev, { ...d, key: `k${keySeq++}` }]);
  const remove = (key: string) =>
    setItems((prev) => prev.filter((d) => d.key !== key));

  function addCardio() {
    const distM = Math.round(num(cDist) * (cUnit === 'km' ? 1000 : 1));
    const durS = Math.round(num(cMin) * 60);
    add({
      kind: 'ACTIVITY',
      activityType: cType,
      targetDistanceM: distM || null,
      targetDurationSec: durS || null,
    });
    setCDist('');
    setCMin('');
  }

  async function save() {
    setSaving(true);
    // reconstruye TODO el plan: los otros días + los ítems de este día
    const others: PlanItemInput[] = plan.items
      .filter((i) => i.dayOfWeek !== day)
      .map((i) => ({
        dayOfWeek: i.dayOfWeek,
        kind: i.kind,
        routineId: i.kind === 'ROUTINE' ? i.routineId ?? undefined : undefined,
        activityType: i.kind === 'ACTIVITY' ? i.activityType ?? undefined : undefined,
        targetDistanceM: i.kind === 'ACTIVITY' ? i.targetDistanceM : null,
        targetDurationSec: i.kind === 'ACTIVITY' ? i.targetDurationSec : null,
      }));
    const mine = items.map((d) => draftToInput(d, day));
    try {
      const updated = await updatePlan(plan.id, { items: [...others, ...mine] });
      onSaved(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos guardar el plan.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ${WEEKDAY_FULL[day]}`}
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            {WEEKDAY_FULL[day]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
        {/* Ítems actuales */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-textMuted">
              Sin nada planeado. Agregá abajo.
            </p>
          ) : (
            items.map((d) => (
              <div
                key={d.key}
                className="flex items-center gap-3 rounded-2xl bg-surface p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-primary">
                  <DraftIcon d={d} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {draftTitle(d)}
                  </p>
                  {draftSubtitle(d) && (
                    <p className="truncate text-xs text-textMuted">{draftSubtitle(d)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(d.key)}
                  aria-label="Quitar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-textMuted transition hover:text-danger active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Agregar rutina de gym */}
        {routines.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-textMuted">Rutina de gym</h3>
            <div className="flex flex-wrap gap-1.5">
              {routines.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => add({ kind: 'ROUTINE', routineId: r.id, routineName: r.name })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surfaceRaised px-3 py-2 text-sm text-text transition hover:bg-white/5 active:scale-95"
                >
                  <Dumbbell className="h-4 w-4 text-primary" />
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agregar cardio */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-textMuted">Cardio</h3>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_TYPES.map((t) => {
              const Icon = activityIcon(t);
              const on = cType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCType(t)}
                  aria-pressed={on}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition active:scale-95',
                    on
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                      : 'bg-surfaceRaised text-textMuted hover:text-text',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {activityLabel(t)}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-end gap-2">
            <input
              inputMode="decimal"
              value={cDist}
              onChange={(e) => setCDist(e.target.value)}
              placeholder={`Distancia (${cUnit})`}
              aria-label={`Distancia objetivo en ${cUnit}`}
              className="h-11 min-w-0 flex-1 rounded-2xl bg-surfaceRaised px-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              inputMode="numeric"
              value={cMin}
              onChange={(e) => setCMin(e.target.value)}
              placeholder="Minutos"
              aria-label="Minutos objetivo"
              className="h-11 min-w-0 flex-1 rounded-2xl bg-surfaceRaised px-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={addCardio}
              className="flex h-11 items-center gap-1 rounded-2xl bg-primary/15 px-3 text-sm font-semibold text-primary transition hover:bg-primary/25 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Descanso */}
        <button
          type="button"
          onClick={() => add({ kind: 'REST' })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3 text-sm font-semibold text-textMuted transition hover:text-text active:scale-[0.99]"
        >
          <Moon className="h-4 w-4" />
          Marcar descanso
        </button>

        <Button onClick={save} loading={saving}>
          Guardar día
        </Button>
      </div>
    </div>
  );
}

function DraftIcon({ d }: { d: Draft }) {
  if (d.kind === 'REST') return <Moon className="h-5 w-5" />;
  if (d.kind === 'ROUTINE') return <Dumbbell className="h-5 w-5" />;
  const Icon = d.activityType ? activityIcon(d.activityType) : Dumbbell;
  return <Icon className="h-5 w-5" />;
}

function draftTitle(d: Draft): string {
  if (d.kind === 'REST') return 'Descanso';
  if (d.kind === 'ROUTINE') return d.routineName ?? 'Rutina';
  return d.activityType ? activityLabel(d.activityType) : 'Cardio';
}

function draftSubtitle(d: Draft): string {
  if (d.kind !== 'ACTIVITY' || !d.activityType) return '';
  return [
    d.targetDistanceM ? formatDistance(d.targetDistanceM, d.activityType) : '',
    d.targetDurationSec ? formatDuration(d.targetDurationSec) : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
