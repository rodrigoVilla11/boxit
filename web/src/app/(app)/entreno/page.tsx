'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Loader2, Plus } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ExerciseCard } from '@/components/workout/exercise-card';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { FinishSummary } from '@/components/workout/finish-summary';
import { RestTimerBar } from '@/components/workout/rest-timer-bar';
import { WorkoutHeader } from '@/components/workout/workout-header';
import { useActiveWorkout } from '@/hooks/use-active-workout';
import { useRestTimer } from '@/hooks/use-rest-timer';
import { logout } from '@/lib/auth';
import type { SetPatch, Workout } from '@/lib/workouts';

export default function EntrenoPage() {
  const router = useRouter();
  const wo = useActiveWorkout();
  const rest = useRestTimer();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [summary, setSummary] = useState<Workout | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  async function onSaveSet(setId: string, patch: SetPatch) {
    await wo.saveSet(setId, patch);
    if (patch.completed === true) rest.start();
  }

  async function onFinish() {
    setFinishing(true);
    try {
      const done = await wo.finish();
      rest.skip();
      setSummary(done);
    } finally {
      setFinishing(false);
    }
  }

  async function onDiscard() {
    setConfirmDiscard(false);
    rest.skip();
    await wo.discard();
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
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-2 pb-16 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 ring-1 ring-primary/30">
          <Dumbbell className="h-8 w-8 text-primary" />
        </div>
        <BrandMark className="text-3xl" />
        <h1 className="mt-4 font-display text-lg font-semibold text-text">
          Listo para entrenar
        </h1>
        <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
          Arrancá un entreno y registrá cada serie en vivo.
        </p>
        <div className="mt-8 w-full max-w-xs">
          <Button onClick={wo.start} loading={wo.starting}>
            <Plus className="h-5 w-5" />
            Empezar entreno
          </Button>
        </div>
        {wo.error && <p className="mt-3 text-sm text-danger">{wo.error}</p>}
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
          workout.exercises.map((we) => (
            <ExerciseCard
              key={we.id}
              we={we}
              previous={wo.previous[we.exerciseId] ?? null}
              onSaveSet={onSaveSet}
              onAddSet={wo.addSet}
              onRemoveSet={wo.removeSet}
              onToggleWarmup={(setId, warmup) =>
                wo.saveSet(setId, { type: warmup ? 'WARMUP' : 'NORMAL' })
              }
              onRemoveExercise={wo.removeExercise}
            />
          ))
        )}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 font-semibold text-primary transition hover:bg-primary/15"
        >
          <Plus className="h-5 w-5" />
          Agregar ejercicio
        </button>

        {/* espacio para que el rest timer no tape el último contenido */}
        {rest.active && <div className="h-16" aria-hidden />}
      </div>

      {rest.active && (
        <RestTimerBar seconds={rest.seconds} onAdd={() => rest.add(15)} onSkip={rest.skip} />
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (ex) => {
          await wo.addExercise(ex.id);
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
    </div>
  );
}
