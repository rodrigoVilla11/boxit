'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { Menu, MenuItem } from '@/components/ui/menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { PlanWeek } from '@/components/plans/plan-week';
import { DayEditor } from '@/components/plans/day-editor';
import { useToast } from '@/components/toast-provider';
import { cn } from '@/lib/cn';
import { plural } from '@/lib/plural';
import { deleteRoutine, getRoutines, startRoutine, type Routine } from '@/lib/routines';
import {
  activatePlan,
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
  type WeeklyPlan,
} from '@/lib/plans';

export default function RutinasPage() {
  const router = useRouter();
  const toast = useToast();
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [plans, setPlans] = useState<WeeklyPlan[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Routine | null>(null);

  // estado del plan
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [prompt, setPrompt] = useState<null | 'create' | 'rename'>(null);
  const [planToDelete, setPlanToDelete] = useState<WeeklyPlan | null>(null);

  const load = useCallback(() => {
    setLoadError(false);
    setRoutines(null);
    setPlans(null);
    Promise.all([getRoutines(), getPlans()])
      .then(([r, p]) => {
        setRoutines(r);
        setPlans(p);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activePlan = useMemo(
    () => plans?.find((p) => p.active) ?? plans?.[0] ?? null,
    [plans],
  );

  async function onStart(routine: Routine) {
    setStartError(null);
    setStarting(routine.id);
    try {
      await startRoutine(routine.id);
      router.push('/entreno');
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'No se pudo empezar.');
      setStarting(null);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    setRoutines((rs) => (rs ? rs.filter((r) => r.id !== id) : rs));
    try {
      await deleteRoutine(id);
      // una rutina borrada puede haber quedado referenciada en el plan
      getPlans().then(setPlans).catch(() => {});
    } catch {
      load();
    }
  }

  // --- acciones de plan ---
  async function onActivate(id: string) {
    try {
      await activatePlan(id);
      setPlans(await getPlans());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos activar el plan.');
    }
  }
  async function onCreatePlan(name: string) {
    const created = await createPlan(name, []);
    await activatePlan(created.id);
    setPlans(await getPlans());
    setPrompt(null);
  }
  async function onRenamePlan(name: string) {
    if (!activePlan) return;
    await updatePlan(activePlan.id, { name });
    setPlans(await getPlans());
    setPrompt(null);
  }
  async function onDeletePlan() {
    if (!planToDelete) return;
    const id = planToDelete.id;
    const wasActive = planToDelete.active;
    setPlanToDelete(null);
    try {
      await deletePlan(id);
      let next = await getPlans();
      // si borramos el activo y quedan planes, activamos el primero
      if (wasActive && next.length > 0 && !next.some((p) => p.active)) {
        await activatePlan(next[0].id);
        next = await getPlans();
      }
      setPlans(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar el plan.');
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Rutinas</h1>
      </header>

      {startError && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <span>{startError}</span>
          <Link href="/entreno" className="font-semibold underline">
            Ir al entreno
          </Link>
        </div>
      )}

      {loadError ? (
        <ErrorState message="No pudimos cargar tus rutinas." onRetry={load} />
      ) : routines === null || plans === null ? (
        <div className="flex justify-center py-16 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="mt-5 space-y-6 pb-4">
          {/* Plan semanal */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-text">Plan semanal</h2>
            </div>

            {plans.length === 0 ? (
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="text-sm font-medium text-text">Sin plan semanal</p>
                <p className="max-w-[16rem] text-sm text-textMuted">
                  Armá un plan combinando rutinas de gym y cardio por día.
                </p>
                <button
                  type="button"
                  onClick={() => setPrompt('create')}
                  className="mt-3 flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-ink transition hover:bg-primary-deep active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                  Crear plan
                </button>
              </div>
            ) : (
              <>
                {/* selector de planes */}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {plans.map((p) => {
                    const on = activePlan?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => !on && onActivate(p.id)}
                        aria-pressed={on}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95',
                          on
                            ? 'bg-primary text-ink'
                            : 'bg-surfaceRaised text-textMuted hover:text-text',
                        )}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPrompt('create')}
                    aria-label="Crear plan"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surfaceRaised text-textMuted transition hover:text-text active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {activePlan && (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-display text-base font-semibold text-text">
                        {activePlan.name}
                      </p>
                      <Menu
                        label="Opciones del plan"
                        trigger={
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:text-text">
                            <MoreVertical className="h-5 w-5" />
                          </span>
                        }
                      >
                        <MenuItem onClick={() => setPrompt('rename')}>
                          <Pencil className="h-4 w-4" />
                          Renombrar
                        </MenuItem>
                        <MenuItem danger onClick={() => setPlanToDelete(activePlan)}>
                          <Trash2 className="h-4 w-4" />
                          Borrar plan
                        </MenuItem>
                      </Menu>
                    </div>
                    <PlanWeek plan={activePlan} onEditDay={(d) => setEditingDay(d)} />
                  </>
                )}
              </>
            )}
          </section>

          {/* Rutinas de gym */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Rutinas de gym</h2>
              <Link
                href="/rutinas/nueva"
                className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-ink transition hover:bg-primary-deep active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Crear
              </Link>
            </div>
            {routines.length === 0 ? (
              <EmptyRoutines />
            ) : (
              routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  starting={starting === routine.id}
                  disabled={starting !== null}
                  onStart={() => onStart(routine)}
                  onEdit={() => router.push(`/rutinas/${routine.id}/editar`)}
                  onDelete={() => setToDelete(routine)}
                />
              ))
            )}
          </section>
        </div>
      )}

      {editingDay !== null && activePlan && (
        <DayEditor
          plan={activePlan}
          day={editingDay}
          routines={routines ?? []}
          onClose={() => setEditingDay(null)}
          onSaved={(p) => {
            setPlans((prev) => (prev ? prev.map((x) => (x.id === p.id ? p : x)) : prev));
            setEditingDay(null);
          }}
        />
      )}

      <PromptDialog
        open={prompt === 'create'}
        title="Nuevo plan"
        label="Nombre del plan"
        placeholder="Ej: Volumen, Definición…"
        confirmLabel="Crear"
        onConfirm={onCreatePlan}
        onCancel={() => setPrompt(null)}
      />
      <PromptDialog
        open={prompt === 'rename'}
        title="Renombrar plan"
        label="Nombre del plan"
        initial={activePlan?.name ?? ''}
        onConfirm={onRenamePlan}
        onCancel={() => setPrompt(null)}
      />

      <ConfirmDialog
        open={planToDelete !== null}
        title="¿Borrar el plan?"
        message={`Se elimina "${planToDelete?.name ?? ''}" y su semana. No afecta a tus rutinas ni al historial.`}
        confirmLabel="Borrar"
        danger
        onConfirm={onDeletePlan}
        onCancel={() => setPlanToDelete(null)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar rutina?"
        message={`Se va a eliminar "${toDelete?.name ?? ''}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function RoutineCard({
  routine,
  starting,
  disabled,
  onStart,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  starting: boolean;
  disabled: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalSets = routine.exercises.reduce((a, e) => a + e.targetSets, 0);
  const preview = routine.exercises.map((e) => e.exercise.name).join(' · ');

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-text">
          {routine.name}
        </h3>
        <Menu
          label="Opciones de la rutina"
          trigger={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:text-text">
              <MoreVertical className="h-5 w-5" />
            </span>
          }
        >
          <MenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar rutina
          </MenuItem>
          <MenuItem danger onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Eliminar rutina
          </MenuItem>
        </Menu>
      </div>

      <p className="mt-0.5 line-clamp-2 text-sm text-textMuted">{preview}</p>
      <p className="mt-2 text-xs text-textMuted">
        {plural(routine.exercises.length, 'ejercicio', 'ejercicios')} ·{' '}
        {plural(totalSets, 'serie', 'series')}
      </p>

      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/15 py-2.5 font-semibold text-primary transition hover:bg-primary/25 active:scale-[0.99] disabled:opacity-60"
      >
        {starting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className="h-5 w-5" />
        )}
        Empezar entreno
      </button>
    </section>
  );
}

function EmptyRoutines() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-textMuted">
        <ClipboardList className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-text">Todavía no tenés rutinas</p>
      <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
        Creá una plantilla de gym para usarla en tu plan y empezar más rápido.
      </p>
    </div>
  );
}
