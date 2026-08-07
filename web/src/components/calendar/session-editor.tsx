'use client';

import { useState } from 'react';
import { Dumbbell, Loader2, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import { formatDuration } from '@/lib/format';
import {
  ACTIVITY_TYPES,
  activityDistanceUnit,
  activityIcon,
  activityLabel,
  formatDistance,
} from '@/lib/activity';
import type { ActivityType } from '@/lib/activities';
import type { Routine } from '@/lib/routines';
import { intervalsSummary, type CardioRoutine } from '@/lib/cardio-routines';
import {
  createSession,
  deleteSession,
  sessionTargets,
  toDayStr,
  type ScheduledSession,
  type ScheduledSessionInput,
} from '@/lib/schedule';

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Sheet para armar un día del calendario: cada tap agrega la sesión al toque
 * (sin borrador): rutina de gym, plantilla de cardio o cardio suelto.
 */
export function SessionEditor({
  date,
  sessions,
  routines,
  cardioRoutines,
  onClose,
  onChanged,
}: {
  date: Date;
  sessions: ScheduledSession[]; // las ya programadas ese día
  routines: Routine[];
  cardioRoutines: CardioRoutine[];
  onClose: () => void;
  onChanged: () => void; // el padre recarga el calendario
}) {
  const toast = useToast();
  useLockBody(true);
  const [busy, setBusy] = useState(false);

  // sub-form de cardio suelto
  const [cType, setCType] = useState<ActivityType>('SWIM');
  const [cDist, setCDist] = useState('');
  const [cMin, setCMin] = useState('');
  const cUnit = activityDistanceUnit(cType) ?? 'm';

  const title = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function add(input: Omit<ScheduledSessionInput, 'date'>) {
    if (busy) return;
    setBusy(true);
    try {
      await createSession({ ...input, date: toDayStr(date) });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos programar la sesión.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await deleteSession(id);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar la sesión.');
    } finally {
      setBusy(false);
    }
  }

  function addCardio() {
    const distM = Math.round(num(cDist) * (cUnit === 'km' ? 1000 : 1));
    const durS = Math.round(num(cMin) * 60);
    void add({
      kind: 'ACTIVITY',
      activityType: cType,
      targetDistanceM: distM || null,
      targetDurationSec: durS || null,
    });
    setCDist('');
    setCMin('');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Programar ${title}`}
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold capitalize text-text">
            {title}
          </h2>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-textMuted" />}
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
        {/* Sesiones ya programadas */}
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-textMuted">
              Sin nada programado. Agregá abajo.
            </p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-primary">
                  <SessionIcon s={s} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {sessionTitle(s)}
                  </p>
                  {sessionSubtitle(s) && (
                    <p className="truncate text-xs text-textMuted">{sessionSubtitle(s)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
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
                  onClick={() => add({ kind: 'ROUTINE', routineId: r.id })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surfaceRaised px-3 py-2 text-sm text-text transition hover:bg-white/5 active:scale-95"
                >
                  <Dumbbell className="h-4 w-4 text-primary" />
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plantillas de cardio */}
        {cardioRoutines.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-textMuted">
              Plantillas de cardio
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {cardioRoutines.map((c) => {
                const Icon = activityIcon(c.type);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => add({ kind: 'ACTIVITY', cardioRoutineId: c.id })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surfaceRaised px-3 py-2 text-sm text-text transition hover:bg-white/5 active:scale-95"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cardio suelto */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-textMuted">Cardio suelto</h3>
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
      </div>
    </div>
  );
}

export function SessionIcon({ s }: { s: ScheduledSession }) {
  if (s.kind === 'ROUTINE') return <Dumbbell className="h-5 w-5" />;
  const { type } = sessionTargets(s);
  const Icon = type ? activityIcon(type) : Dumbbell;
  return <Icon className="h-5 w-5" />;
}

export function sessionTitle(s: ScheduledSession): string {
  if (s.kind === 'ROUTINE') return s.routine?.name ?? 'Rutina eliminada';
  if (s.cardioRoutine) return s.cardioRoutine.name;
  const { type } = sessionTargets(s);
  return type ? activityLabel(type) : 'Cardio';
}

export function sessionSubtitle(s: ScheduledSession): string {
  if (s.kind !== 'ACTIVITY') return s.note ?? '';
  const { type, distanceM, durationSec } = sessionTargets(s);
  return [
    s.cardioRoutine && type ? activityLabel(type) : '',
    distanceM && type ? formatDistance(distanceM, type) : '',
    durationSec ? formatDuration(durationSec) : '',
    s.cardioRoutine ? intervalsSummary(s.cardioRoutine.intervals) : '',
    s.note ?? '',
  ]
    .filter(Boolean)
    .join(' · ');
}
