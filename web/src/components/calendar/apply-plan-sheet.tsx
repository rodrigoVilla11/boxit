'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useLockBody } from '@/hooks/use-lock-body';
import { plural } from '@/lib/plural';
import { mondayOf, startOfDay, WEEKDAY_LABELS } from '@/lib/week';
import { getPlans, type PlanItem, type WeeklyPlan } from '@/lib/plans';
import {
  createProgram,
  sessionDay,
  toDayStr,
  type ScheduledSessionInput,
  type TrainingProgram,
} from '@/lib/schedule';

const fmt = (d: Date): string =>
  d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

/** Ítems que se pueden programar: ni descansos ni referencias a cosas borradas. */
function usable(it: PlanItem): boolean {
  if (it.kind === 'ROUTINE') return it.routineId !== null;
  if (it.kind === 'ACTIVITY') return it.cardioRoutineId !== null || it.activityType !== null;
  return false; // REST: el calendario sólo lista sesiones
}

/**
 * Proyecta el plan (cíclico, por día de semana) a fechas absolutas desde el
 * lunes `startMonday`, `weeks` semanas. Nunca programa en el pasado: si la
 * primera semana ya empezó, los días anteriores a hoy se saltean.
 */
function buildSessions(
  plan: WeeklyPlan,
  startMonday: Date,
  weeks: number,
): ScheduledSessionInput[] {
  const today = startOfDay(new Date());
  const out: ScheduledSessionInput[] = [];
  for (let w = 0; w < weeks; w++) {
    for (const it of plan.items) {
      if (!usable(it)) continue;
      const d = new Date(startMonday);
      d.setDate(d.getDate() + w * 7 + it.dayOfWeek);
      if (d < today) continue;
      out.push({
        date: toDayStr(d),
        kind: it.kind,
        routineId: it.routineId ?? undefined,
        cardioRoutineId: it.cardioRoutineId,
        activityType: it.activityType ?? undefined,
        targetDistanceM: it.targetDistanceM,
        targetDurationSec: it.targetDurationSec,
        note: it.note,
      });
    }
  }
  return out;
}

/**
 * Lleva el plan semanal ACTIVO al calendario: lo materializa como un programa
 * (agrupado, borrable de una) para las próximas N semanas. Si después cambiás
 * el plan, se limpia el calendario y se vuelve a aplicar.
 */
export function ApplyPlanSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: TrainingProgram) => void;
}) {
  useLockBody(true);
  const [plan, setPlan] = useState<WeeklyPlan | null | undefined>(undefined);
  const [start, setStart] = useState<'this' | 'next'>('this');
  const [weeks, setWeeks] = useState(4);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then((ps) => setPlan(ps.find((p) => p.active) ?? ps[0] ?? null))
      .catch(() => {
        setPlan(null);
        setError('No pudimos cargar tu plan semanal.');
      });
  }, []);

  const startMonday = useMemo(() => {
    const m = mondayOf(new Date());
    if (start === 'next') m.setDate(m.getDate() + 7);
    return m;
  }, [start]);

  const sessions = useMemo(
    () => (plan ? buildSessions(plan, startMonday, weeks) : []),
    [plan, startMonday, weeks],
  );

  const perWeek = useMemo(
    () => (plan ? plan.items.filter(usable).length : 0),
    [plan],
  );
  const activeDows = useMemo(
    () => new Set(plan?.items.filter(usable).map((it) => it.dayOfWeek)),
    [plan],
  );
  const hasBroken = useMemo(
    () =>
      plan?.items.some((it) => it.kind === 'ROUTINE' && it.routineId === null) ??
      false,
    [plan],
  );

  async function confirm() {
    if (!plan || sessions.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const program = await createProgram({
        name: plan.name,
        note: 'Tu plan semanal, llevado al calendario.',
        sessions,
      });
      onCreated(program);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos aplicar el plan.');
      setPending(false);
    }
  }

  const first = sessions[0]?.date;
  const last = sessions[sessions.length - 1]?.date;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[75] flex items-end justify-center bg-black/60 px-4 pb-safe backdrop-blur-sm"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aplicar plan semanal"
        className="app-shell animate-sheet-in mb-4 w-full rounded-3xl border border-white/10 bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-text">
          Aplicar plan semanal
        </h2>

        {plan === undefined ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-textMuted" />
          </div>
        ) : plan === null ? (
          <>
            <p className="mt-1.5 text-sm text-textMuted">
              {error ?? 'Todavía no tenés un plan semanal.'}
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cerrar
              </Button>
              <Link
                href="/rutinas"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-semibold text-ink transition hover:bg-primary-deep active:scale-[0.98]"
              >
                Armar mi plan
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-textMuted">
              Programa <span className="font-semibold text-text">{plan.name}</span>{' '}
              ({plural(perWeek, 'sesión', 'sesiones')} por semana) como un
              programa en el calendario.
            </p>

            {/* días de la semana que el plan usa (sólo lectura) */}
            <div className="mt-3 flex gap-1.5">
              {WEEKDAY_LABELS.map((label, dow) => (
                <span
                  key={dow}
                  className={cn(
                    'flex h-9 flex-1 items-center justify-center rounded-xl text-xs font-bold uppercase',
                    activeDows.has(dow)
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                      : 'bg-surfaceRaised text-textMuted/60',
                  )}
                >
                  {label}
                </span>
              ))}
            </div>

            {hasBroken && (
              <p className="mt-2 text-xs text-textMuted">
                Algún día del plan usa una rutina borrada: esos ítems se saltean.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Empieza</span>
              <div className="flex items-center gap-1 rounded-xl bg-surfaceRaised p-1">
                {(
                  [
                    ['this', 'Esta semana'],
                    ['next', 'Próxima'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStart(value)}
                    aria-pressed={start === value}
                    className={cn(
                      'h-9 rounded-lg px-3 text-sm font-semibold transition active:scale-95',
                      start === value
                        ? 'bg-primary text-ink'
                        : 'text-textMuted hover:text-text',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Repetir por</span>
              <div className="flex items-center gap-1 rounded-xl bg-surfaceRaised p-1">
                <button
                  type="button"
                  onClick={() => setWeeks((w) => Math.max(1, w - 1))}
                  aria-label="Menos semanas"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-20 text-center text-sm tabular-nums text-text">
                  {plural(weeks, 'semana', 'semanas')}
                </span>
                <button
                  type="button"
                  onClick={() => setWeeks((w) => Math.min(26, w + 1))}
                  aria-label="Más semanas"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {sessions.length > 0 ? (
              <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                Se van a programar{' '}
                {plural(sessions.length, 'sesión', 'sesiones')}, del{' '}
                {fmt(sessionDay(`${first}T12:00:00.000Z`))} al{' '}
                {fmt(sessionDay(`${last}T12:00:00.000Z`))}.
              </p>
            ) : (
              <p className="mt-3 rounded-xl bg-surfaceRaised px-3 py-2 text-sm text-textMuted">
                {perWeek === 0
                  ? 'Tu plan no tiene días de entreno todavía: armalo en Rutinas.'
                  : 'No queda nada por programar en ese rango.'}
              </p>
            )}

            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <Button variant="ghost" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button
                onClick={confirm}
                loading={pending}
                disabled={sessions.length === 0}
              >
                <CalendarPlus className="h-4 w-4" />
                Aplicar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
