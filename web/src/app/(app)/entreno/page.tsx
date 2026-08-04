'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Dumbbell,
  GripVertical,
  Loader2,
  Moon,
  Plus,
  Waves,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ExerciseCard } from '@/components/workout/exercise-card';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { ActivityForm, type ActivityPrefill } from '@/components/activity/activity-form';
import { startRoutine } from '@/lib/routines';
import { getPlans, itemTargets, type PlanItem, type WeeklyPlan } from '@/lib/plans';
import { activityIcon, activityLabel, formatDistance } from '@/lib/activity';
import { formatDuration } from '@/lib/format';
import { todayDow } from '@/lib/week';
import { FinishSummary } from '@/components/workout/finish-summary';
import { SettingsButton } from '@/components/nav/settings-button';
import { WorkoutHeader } from '@/components/workout/workout-header';
import { useActiveWorkout } from '@/hooks/use-active-workout';
import { useRestTimerCtx } from '@/components/rest-timer-provider';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useToast } from '@/components/toast-provider';
import { logout } from '@/lib/auth';
import {
  getPersonalRecords,
  type PersonalRecord,
  type SetPatch,
  type Workout,
  type WorkoutExercise,
} from '@/lib/workouts';
import { bumpRecord, isNewPr } from '@/lib/prs';

export default function EntrenoPage() {
  const router = useRouter();
  const wo = useActiveWorkout();
  const rest = useRestTimerCtx();
  const toast = useToast();

  // Pantalla encendida mientras haya un entreno activo
  useWakeLock(!!wo.workout);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [summary, setSummary] = useState<Workout | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [removeExId, setRemoveExId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityPrefill, setActivityPrefill] = useState<ActivityPrefill | null>(null);
  const [activePlan, setActivePlan] = useState<WeeklyPlan | null>(null);
  const [startingRoutine, setStartingRoutine] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Plan activo → "hoy toca"
  useEffect(() => {
    getPlans()
      .then((ps) => setActivePlan(ps.find((p) => p.active) ?? ps[0] ?? null))
      .catch(() => {});
  }, []);

  async function onStartPlanRoutine(routineId: string) {
    if (startingRoutine) return;
    setPlanError(null);
    setStartingRoutine(true);
    try {
      await startRoutine(routineId);
      await wo.reload(); // el entreno recién creado en el server
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : 'No se pudo empezar la rutina.');
      setStartingRoutine(false);
    }
  }

  function openPlanActivity(item: PlanItem) {
    // con plantilla, el formulario arranca con su nombre y sus intervalos
    const { type, distanceM, durationSec } = itemTargets(item);
    setActivityPrefill({
      type: type ?? undefined,
      label: item.cardioRoutine?.name ?? null,
      targetDistanceM: distanceM,
      targetDurationSec: durationSec,
      intervals: item.cardioRoutine?.intervals,
    });
    setActivityOpen(true);
  }

  const removeExName = wo.workout?.exercises.find((e) => e.id === removeExId)
    ?.exercise.name;

  // Sensor con umbral chico: el arrastre sólo se activa desde el grip
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onExerciseDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id || !wo.workout) return;
    const ids = wo.workout.exercises.map((x) => x.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    wo.reorderExercises(arrayMove(ids, from, to));
  }

  // Récords base (entrenos terminados) para detectar PRs en vivo. La baseline
  // no se muta (alimenta la insignia); `celebrated` evita re-festejar.
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const celebrated = useRef<Record<string, PersonalRecord>>({});

  useEffect(() => {
    getPersonalRecords()
      .then((list) =>
        setPrs(Object.fromEntries(list.map((p) => [p.exerciseId, p]))),
      )
      .catch(() => {});
  }, []);

  async function onSaveSet(setId: string, patch: SetPatch) {
    const ex = wo.workout?.exercises.find((e) =>
      e.sets.some((s) => s.id === setId),
    );
    const set = ex?.sets.find((s) => s.id === setId);
    const ok = await wo.saveSet(setId, patch);
    if (!ok) return;
    if (patch.completed === true) {
      rest.start();
      // ¿Récord? Compará el peso/reps recién completados con el mejor previo.
      if (
        ex &&
        set?.type === 'NORMAL' &&
        patch.weight != null &&
        patch.reps != null
      ) {
        const effective = celebrated.current[ex.exerciseId] ?? prs[ex.exerciseId];
        if (isNewPr(effective, patch.weight, patch.reps)) {
          toast.success(`¡Nuevo récord en ${ex.exercise.name}! 🏆`);
          if (typeof navigator !== 'undefined') navigator.vibrate?.([60, 40, 120]);
          celebrated.current[ex.exerciseId] = bumpRecord(
            effective,
            ex.exerciseId,
            ex.exercise.name,
            patch.weight,
            patch.reps,
          );
        }
      }
    }
  }

  async function onFinish() {
    setFinishing(true);
    try {
      const done = await wo.finish();
      if (done) {
        rest.skip();
        setSummary(done);
      }
    } finally {
      setFinishing(false);
    }
  }

  async function onDiscard() {
    rest.skip();
    await wo.discard();
    setConfirmDiscard(false);
  }

  async function onLogout() {
    await logout();
    router.replace('/login');
    router.refresh();
  }

  // Resumen post-entreno
  if (summary) {
    return <FinishSummary workout={summary} onClose={() => setSummary(null)} />;
  }

  // Cargando
  if (wo.loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <BrandMark className="animate-pulse text-4xl" />
      </div>
    );
  }

  // Sin entreno activo → empezar
  if (!wo.workout) {
    const todayItems = activePlan
      ? activePlan.items.filter((i) => i.dayOfWeek === todayDow())
      : [];
    const hasPlan = todayItems.some((i) => i.kind !== 'REST');
    const onlyRest = todayItems.length > 0 && !hasPlan;

    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-2 pb-16 text-center">
        {/* la pantalla vacía no tiene barra propia: el acceso a Ajustes va en la esquina */}
        <header className="absolute right-0 top-0 pt-safe">
          <SettingsButton className="mt-6" />
        </header>
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 ring-1 ring-primary/30">
          <Dumbbell className="h-8 w-8 text-primary" />
        </div>
        <BrandMark className="text-3xl" />
        <h1 className="mt-4 font-display text-lg font-semibold text-text">
          {onlyRest ? 'Hoy toca descanso' : 'Listo para entrenar'}
        </h1>
        <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
          {onlyRest
            ? 'Recuperar también es entrenar. Disfrutá el día.'
            : 'Arrancá un entreno y registrá cada serie en vivo.'}
        </p>

        {hasPlan && (
          <div className="mt-6 w-full max-w-xs rounded-2xl bg-surface p-3 text-left shadow-card">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-textMuted">
              Hoy toca
            </p>
            <div className="space-y-1.5">
              {todayItems.map((item) => {
                if (item.kind === 'REST') return null;
                if (item.kind === 'ROUTINE') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        item.routineId && onStartPlanRoutine(item.routineId)
                      }
                      disabled={!item.routineId || startingRoutine}
                      className="flex w-full items-center gap-3 rounded-xl bg-surfaceRaised p-3 transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <Dumbbell className="h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate font-semibold text-text">
                        {item.routine?.name ?? 'Rutina eliminada'}
                      </span>
                      {startingRoutine ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                      ) : (
                        <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                }
                const { type, distanceM, durationSec } = itemTargets(item);
                const Icon = type ? activityIcon(type) : Waves;
                const target = [
                  distanceM && type ? formatDistance(distanceM, type) : '',
                  durationSec ? formatDuration(durationSec) : '',
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openPlanActivity(item)}
                    className="flex w-full items-center gap-3 rounded-xl bg-surfaceRaised p-3 transition active:scale-[0.98]"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-left">
                      <span className="font-semibold text-text">
                        {item.cardioRoutine?.name ??
                          (type ? activityLabel(type) : 'Cardio')}
                      </span>
                      {target && <span className="text-textMuted"> · {target}</span>}
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 w-full max-w-xs space-y-2">
          <Button onClick={wo.start} loading={wo.starting} variant={hasPlan ? 'ghost' : 'primary'}>
            <Plus className="h-5 w-5" />
            {hasPlan ? 'Entreno libre' : 'Empezar entreno'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setActivityPrefill(null);
              setActivityOpen(true);
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-surfaceRaised font-semibold text-text transition hover:bg-white/5 active:scale-[0.98]"
          >
            <Waves className="h-5 w-5 text-primary" />
            Registrar actividad
          </button>
        </div>
        {(wo.error || planError) && (
          <p className="mt-3 text-sm text-danger">{planError ?? wo.error}</p>
        )}

        {activityOpen && (
          <ActivityForm
            initial={null}
            prefill={activityPrefill ?? undefined}
            onClose={() => {
              setActivityOpen(false);
              setActivityPrefill(null);
            }}
            onSaved={() => {
              setActivityOpen(false);
              setActivityPrefill(null);
              toast.success('Actividad guardada.');
            }}
          />
        )}
      </div>
    );
  }

  const workout = wo.workout;

  return (
    <div className="flex min-h-dvh flex-col">
      <WorkoutHeader
        workout={workout}
        finishing={finishing}
        onFinish={onFinish}
        onDiscard={() => setConfirmDiscard(true)}
        onLogout={onLogout}
      />

      <div className="flex-1 space-y-3 pt-4">
        {workout.exercises.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
            <p className="text-sm font-medium text-text">Sin ejercicios todavía</p>
            <p className="text-xs text-textMuted">
              Agregá el primero desde la librería.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onExerciseDragEnd}
          >
            <SortableContext
              items={workout.exercises.map((we) => we.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {workout.exercises.map((we) => (
                  <SortableExercise
                    key={we.id}
                    we={we}
                    previous={wo.previous[we.exerciseId] ?? null}
                    record={prs[we.exerciseId]}
                    onSaveSet={onSaveSet}
                    onAddSet={wo.addSet}
                    onRemoveSet={wo.removeSet}
                    onToggleWarmup={(setId, warmup) =>
                      wo.saveSet(setId, { type: warmup ? 'WARMUP' : 'NORMAL' })
                    }
                    onRemoveExercise={setRemoveExId}
                    onReorderSets={wo.reorderSets}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 font-semibold text-primary transition hover:bg-primary/15"
        >
          <Plus className="h-5 w-5" />
          Agregar ejercicio
        </button>

      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (ex) => {
          await wo.addExercise(ex);
        }}
      />

      <ConfirmDialog
        open={confirmDiscard}
        title="¿Descartar entreno?"
        message="Se va a perder todo lo que cargaste en esta sesión."
        confirmLabel="Descartar"
        danger
        onConfirm={onDiscard}
        onCancel={() => setConfirmDiscard(false)}
      />

      <ConfirmDialog
        open={removeExId !== null}
        title="¿Quitar ejercicio?"
        message={`Se van a borrar las series cargadas de ${removeExName ?? 'este ejercicio'}.`}
        confirmLabel="Quitar"
        danger
        onConfirm={async () => {
          if (removeExId) await wo.removeExercise(removeExId);
          setRemoveExId(null);
        }}
        onCancel={() => setRemoveExId(null)}
      />
    </div>
  );
}

/** Envuelve ExerciseCard con drag-reorder (arrastre sólo desde el grip). */
function SortableExercise({
  we,
  ...props
}: {
  we: WorkoutExercise;
} & Omit<React.ComponentProps<typeof ExerciseCard>, 'we' | 'dragHandle'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: we.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label="Reordenar ejercicio"
      className="-ml-1 mt-0.5 flex h-6 w-6 shrink-0 touch-none items-center justify-center rounded-md text-textMuted hover:text-text"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard we={we} dragHandle={handle} {...props} />
    </div>
  );
}
