'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarPlus,
  Check,
  ClipboardCheck,
  CopyPlus,
  Dumbbell,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { SettingsButton } from '@/components/nav/settings-button';
import { useToast } from '@/components/toast-provider';
import { ActivityForm, type ActivityPrefill } from '@/components/activity/activity-form';
import {
  MonthGrid,
  monthGridRange,
} from '@/components/calendar/month-grid';
import {
  SessionEditor,
  SessionIcon,
  sessionSubtitle,
  sessionTitle,
} from '@/components/calendar/session-editor';
import { ProgramWizard } from '@/components/calendar/program-wizard';
import { DuplicateWeekSheet } from '@/components/calendar/duplicate-week-sheet';
import { plural } from '@/lib/plural';
import { cn } from '@/lib/cn';
import { activityIcon } from '@/lib/activity';
import {
  computeDayCompletion,
  toEfforts,
  type DayCompletion,
  type SessionOutcome,
} from '@/lib/session-completion';
import { dayKey, mondayOf, startOfDay } from '@/lib/week';
import { getRoutines, startRoutine, type Routine } from '@/lib/routines';
import { getCardioRoutines, type CardioRoutine } from '@/lib/cardio-routines';
import { getHistory, type WorkoutSummary } from '@/lib/workouts';
import { getActivities, type Activity } from '@/lib/activities';
import {
  deleteProgram,
  deleteSession,
  getPrograms,
  getSchedule,
  sessionDay,
  sessionTargets,
  type ScheduledSession,
  type TrainingProgram,
} from '@/lib/schedule';

const fmtDay = (d: Date): string =>
  d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

/** "mié 12" a partir de un dayKey (para el texto de recuperada). */
const fmtDayKey = (k: number | null): string => {
  if (k === null) return '';
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + (k - dayKey(d)));
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
};

export default function CalendarioPage() {
  const router = useRouter();
  const toast = useToast();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [sessions, setSessions] = useState<ScheduledSession[] | null>(null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [cardio, setCardio] = useState<CardioRoutine[]>([]);
  const [history, setHistory] = useState<WorkoutSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadError, setLoadError] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<TrainingProgram | null>(null);
  const [registering, setRegistering] = useState<ActivityPrefill | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const loadSchedule = useCallback((m: Date) => {
    const { start, end } = monthGridRange(m);
    return getSchedule(start, end);
  }, []);

  const reload = useCallback(() => {
    setLoadError(false);
    loadSchedule(month)
      .then(setSessions)
      .catch(() => setLoadError(true));
    getPrograms().then(setPrograms).catch(() => {});
  }, [month, loadSchedule]);

  useEffect(() => {
    reload();
  }, [reload]);

  // catálogos y sesiones reales (para el punto verde de "entrenado")
  useEffect(() => {
    getRoutines().then(setRoutines).catch(() => {});
    getCardioRoutines().then(setCardio).catch(() => {});
    getHistory().then(setHistory).catch(() => {});
    getActivities().then(setActivities).catch(() => {});
  }, []);

  const sessionsByDay = useMemo(() => {
    const map = new Map<number, ScheduledSession[]>();
    for (const s of sessions ?? []) {
      const k = dayKey(sessionDay(s.date));
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    }
    return map;
  }, [sessions]);

  // Semana (lunes a domingo) del día seleccionado y cuántas sesiones tiene
  const weekStart = useMemo(() => mondayOf(selected), [selected]);
  const weekSessionCount = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      n += sessionsByDay.get(dayKey(d))?.length ?? 0;
    }
    return n;
  }, [weekStart, sessionsByDay]);

  // Qué sesión programada cumplió cada entreno/actividad (por rutina, no por día)
  const completion = useMemo(() => {
    const { start, end } = monthGridRange(month);
    return computeDayCompletion(sessions ?? [], toEfforts(history, activities), {
      fromK: dayKey(start),
      toK: dayKey(end),
    });
  }, [month, sessions, history, activities]);

  const daySessions = sessionsByDay.get(dayKey(selected)) ?? [];
  const dayCompletion: DayCompletion | undefined = completion.get(dayKey(selected));
  const outcomeById = useMemo(() => {
    const map = new Map<string, SessionOutcome>();
    for (const o of dayCompletion?.outcomes ?? []) map.set(o.session.id, o);
    return map;
  }, [dayCompletion]);

  async function onStart(s: ScheduledSession) {
    if (!s.routineId || starting) return;
    setStarting(s.id);
    try {
      await startRoutine(s.routineId);
      router.push('/entreno');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo empezar la rutina.');
      setStarting(null);
    }
  }

  function onRegister(s: ScheduledSession) {
    const { type, distanceM, durationSec } = sessionTargets(s);
    setRegistering({
      type: type ?? undefined,
      label: s.cardioRoutine?.name ?? null,
      targetDistanceM: distanceM,
      targetDurationSec: durationSec,
      intervals: s.cardioRoutine?.intervals,
    });
  }

  async function onDeleteSession(s: ScheduledSession) {
    try {
      await deleteSession(s.id);
      setSessions((prev) => prev?.filter((x) => x.id !== s.id) ?? prev);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar la sesión.');
    }
  }

  async function onDeleteProgram() {
    if (!programToDelete) return;
    try {
      await deleteProgram(programToDelete.id);
      toast.success('Programa borrado.');
      setProgramToDelete(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar el programa.');
    }
  }

  function onProgramCreated(p: TrainingProgram) {
    setWizardOpen(false);
    toast.success(
      `¡Listo! ${plural(p.sessionCount, 'sesión programada', 'sesiones programadas')}.`,
    );
    if (p.startDate) {
      const start = sessionDay(p.startDate);
      setMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      setSelected(start);
    }
    reload();
  }

  const dayTitle = selected.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex min-h-dvh flex-col gap-5 pb-6">
      <header className="flex items-center justify-between pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Calendario</h1>
        <SettingsButton className="mt-6" />
      </header>

      {loadError ? (
        <ErrorState onRetry={reload} />
      ) : sessions === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-textMuted" />
        </div>
      ) : (
        <>
          <MonthGrid
            month={month}
            completion={completion}
            selected={selected}
            onSelect={setSelected}
            onMonthChange={setMonth}
          />

          {/* Día seleccionado */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold capitalize text-textMuted">
                {dayTitle}
                {dayCompletion && dayCompletion.planned > 0 && (
                  <span
                    className={cn(
                      'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold normal-case',
                      dayCompletion.done === dayCompletion.planned
                        ? 'bg-accentLime/15 text-accentLime'
                        : 'bg-surfaceRaised text-textMuted',
                    )}
                  >
                    {dayCompletion.done} de {dayCompletion.planned}
                  </span>
                )}
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                {weekSessionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDupOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-textMuted transition hover:text-text active:scale-95"
                  >
                    <CopyPlus className="h-3.5 w-3.5" />
                    Duplicar semana
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Programar
                </button>
              </div>
            </div>

            {daySessions.length === 0 && !dayCompletion?.extras.length ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-textMuted">
                Nada programado este día.
              </p>
            ) : (
              daySessions.map((s) => {
                const status = outcomeById.get(s.id)?.status ?? 'pending';
                const doneOnK = outcomeById.get(s.id)?.doneOnK ?? null;
                const fulfilled = status === 'done' || status === 'madeUp';
                return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      fulfilled
                        ? 'bg-accentLime/15 text-accentLime'
                        : 'bg-surfaceRaised text-primary',
                    )}
                  >
                    {fulfilled ? <Check className="h-5 w-5" /> : <SessionIcon s={s} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {sessionTitle(s)}
                    </p>
                    {sessionSubtitle(s) && (
                      <p className="line-clamp-2 text-xs text-textMuted">
                        {sessionSubtitle(s)}
                      </p>
                    )}
                    <p
                      className={cn(
                        'mt-0.5 text-[11px] font-semibold',
                        fulfilled
                          ? 'text-accentLime'
                          : status === 'missed'
                            ? 'text-textMuted'
                            : 'text-primary/80',
                      )}
                    >
                      {status === 'done'
                        ? 'Cumplida'
                        : status === 'madeUp'
                          ? `Recuperada el ${fmtDayKey(doneOnK)}`
                          : status === 'missed'
                            ? 'Sin hacer'
                            : 'Pendiente'}
                    </p>
                    {s.program && (
                      <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                        {s.program.name}
                      </p>
                    )}
                  </div>
                  {!fulfilled && s.kind === 'ROUTINE' && s.routineId && (
                    <button
                      type="button"
                      onClick={() => onStart(s)}
                      aria-label="Empezar rutina"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition hover:bg-primary/25 active:scale-90"
                    >
                      {starting === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  {!fulfilled && s.kind === 'ACTIVITY' && (
                    <button
                      type="button"
                      onClick={() => onRegister(s)}
                      aria-label="Registrar actividad"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition hover:bg-primary/25 active:scale-90"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteSession(s)}
                    aria-label="Borrar sesión"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-textMuted transition hover:text-danger active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                );
              })
            )}

            {/* Hecho ese día pero fuera del plan: cuenta para la constancia,
                no cierra ninguna sesión programada. */}
            {dayCompletion?.extras.map((e) => {
              const Icon =
                e.kind === 'ACTIVITY' && e.activityType
                  ? activityIcon(e.activityType)
                  : Dumbbell;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border border-dashed border-accentLime/25 bg-surface/50 p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accentLime/10 text-accentLime/70">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{e.label}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-textMuted">
                      No agendado
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Programas */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-textMuted">Programas</h2>
            </div>
            {programs.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-primary">
                  <CalendarPlus className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{p.name}</p>
                  <p className="text-xs text-textMuted">
                    {plural(p.sessionCount, 'sesión', 'sesiones')}
                    {p.startDate && p.endDate && (
                      <>
                        {' · '}
                        {fmtDay(sessionDay(p.startDate))} →{' '}
                        {fmtDay(sessionDay(p.endDate))}
                      </>
                    )}
                  </p>
                  {p.note && (
                    <p className="truncate text-xs text-textMuted">{p.note}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setProgramToDelete(p)}
                  aria-label={`Borrar ${p.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-textMuted transition hover:text-danger active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3.5 text-sm font-semibold text-textMuted transition hover:border-primary/40 hover:text-primary active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4" />
              Programa pre-armado
            </button>
          </section>
        </>
      )}

      {editorOpen && (
        <SessionEditor
          date={selected}
          sessions={daySessions}
          routines={routines}
          cardioRoutines={cardio}
          onClose={() => setEditorOpen(false)}
          onChanged={reload}
        />
      )}

      {wizardOpen && (
        <ProgramWizard onClose={() => setWizardOpen(false)} onCreated={onProgramCreated} />
      )}

      <DuplicateWeekSheet
        open={dupOpen}
        weekStart={weekStart}
        sessionCount={weekSessionCount}
        onClose={() => setDupOpen(false)}
        onDone={(created) => {
          setDupOpen(false);
          toast.success(
            `Se programaron ${plural(created, 'sesión', 'sesiones')}.`,
          );
          reload();
        }}
      />

      {registering && (
        <ActivityForm
          initial={null}
          prefill={registering}
          onClose={() => setRegistering(null)}
          onSaved={(a) => {
            setActivities((prev) => [a, ...prev]);
            setRegistering(null);
            toast.success('Actividad registrada.');
          }}
        />
      )}

      <ConfirmDialog
        open={!!programToDelete}
        title="¿Borrar programa?"
        message={
          programToDelete
            ? `Se borran las ${plural(
                programToDelete.sessionCount,
                'sesión programada',
                'sesiones programadas',
              )} de "${programToDelete.name}". Tus entrenos ya hechos no se tocan.`
            : ''
        }
        confirmLabel="Borrar"
        danger
        onConfirm={onDeleteProgram}
        onCancel={() => setProgramToDelete(null)}
      />
    </div>
  );
}
