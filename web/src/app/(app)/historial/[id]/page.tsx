'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ClipboardList,
  Loader2,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { muscleLabel } from '@/lib/labels';
import { formatDuration, formatSessionDate } from '@/lib/format';
import { formatVolume, unitLabel, weightValue } from '@/lib/units';
import { useUnit } from '@/components/unit-provider';
import { useToast } from '@/components/toast-provider';
import { ErrorState } from '@/components/ui/error-state';
import { createRoutine } from '@/lib/routines';
import {
  getPersonalRecords,
  getWorkoutById,
  repeatWorkout,
  type PersonalRecord,
  type Workout,
  type WorkoutSet,
} from '@/lib/workouts';

export default function SessionDetailPage() {
  const router = useRouter();
  const { unit } = useUnit();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [prByExercise, setPrByExercise] = useState<Record<string, PersonalRecord>>({});
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<null | 'repeat' | 'routine'>(null);

  const load = useCallback(() => {
    setLoadError(false);
    setWorkout(null);
    getWorkoutById(id)
      .then(setWorkout)
      .catch(() => setLoadError(true));
    getPersonalRecords()
      .then((prs) =>
        setPrByExercise(Object.fromEntries(prs.map((p) => [p.exerciseId, p]))),
      )
      .catch(() => {});
  }, [id]);

  async function onRepeat() {
    if (busy) return;
    setBusy('repeat');
    try {
      await repeatWorkout(id);
      toast.success('Entreno cargado. ¡A darle!');
      router.push('/entreno');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos repetir el entreno.');
      setBusy(null);
    }
  }

  async function onSaveAsRoutine() {
    if (busy || !workout) return;
    setBusy('routine');
    try {
      const name = `Rutina — ${formatSessionDate(workout.finishedAt)}`;
      const exercises = workout.exercises.map((we) => {
        const working = we.sets.filter((s) => s.type === 'NORMAL');
        const first = working[0];
        return {
          exerciseId: we.exerciseId,
          targetSets: Math.max(1, working.length),
          targetReps: first?.reps || null,
          targetWeight: first?.weight || null,
        };
      });
      await createRoutine(name, exercises);
      toast.success('Rutina guardada.');
      router.push('/rutinas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos guardar la rutina.');
      setBusy(null);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  const isPrSet = (record: PersonalRecord | undefined, set: WorkoutSet): boolean => {
    if (!record || !set.completed || set.type !== 'NORMAL') return false;
    return record.metric === 'weight'
      ? set.weight > 0 && set.weight === record.weight
      : set.weight === 0 && set.reps === record.reps;
  };

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 pb-16 text-center">
        <ErrorState message="No pudimos cargar este entreno." onRetry={load} />
        <button
          onClick={() => router.push('/historial')}
          className="text-sm font-semibold text-textMuted transition hover:text-text"
        >
          Volver al historial
        </button>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-textMuted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-1 pt-safe">
        <button
          type="button"
          onClick={() => router.push('/historial')}
          aria-label="Volver"
          className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:text-text"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="mt-5 font-display text-xl font-bold text-text">
          {formatSessionDate(workout.finishedAt)}
        </h1>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Volumen" value={formatVolume(workout.totalVolume, unit)} />
        <Metric label="Duración" value={formatDuration(workout.durationSec)} />
        <Metric label="Series" value={String(workout.totalSets)} />
      </div>

      <div className="mt-4 space-y-3">
        {workout.exercises.map((we) => {
          const record = prByExercise[we.exerciseId];
          return (
            <section key={we.id} className="rounded-2xl bg-surface p-3 shadow-card">
              <header className="px-1 pb-2">
                <h2 className="font-display text-base font-semibold text-primary">
                  {we.exercise.name}
                </h2>
                <p className="text-xs text-textMuted">
                  {muscleLabel(we.exercise.primaryMuscle)}
                </p>
              </header>
              <div className="space-y-1">
                {we.sets.map((set, i) => (
                  <DetailSetRow
                    key={set.id}
                    index={i}
                    set={set}
                    isPr={isPrSet(record, set)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 pb-4">
        <button
          type="button"
          onClick={onRepeat}
          disabled={!!busy}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-ink transition hover:bg-primary-deep disabled:opacity-40"
        >
          {busy === 'repeat' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RotateCcw className="h-5 w-5" />
          )}
          Repetir
        </button>
        <button
          type="button"
          onClick={onSaveAsRoutine}
          disabled={!!busy}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-semibold text-text ring-1 ring-white/10 transition hover:bg-surfaceRaised disabled:opacity-40"
        >
          {busy === 'routine' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ClipboardList className="h-5 w-5" />
          )}
          Guardar rutina
        </button>
      </div>
    </div>
  );
}

function DetailSetRow({
  index,
  set,
  isPr,
}: {
  index: number;
  set: WorkoutSet;
  isPr: boolean;
}) {
  const { unit } = useUnit();
  const isWarmup = set.type === 'WARMUP';
  return (
    <div
      className={cn(
        'grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl px-2 py-2',
        isPr ? 'bg-accentLime/10' : set.completed ? 'row-done' : 'opacity-50',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold',
          isWarmup ? 'bg-accentLime/15 text-accentLime' : 'bg-surfaceRaised text-textMuted',
        )}
      >
        {isWarmup ? 'W' : index + 1}
      </span>

      <span className="text-sm text-text">
        {set.weight > 0 ? (
          <>
            <span className="font-semibold tabular-nums">
              {weightValue(set.weight, unit)}
            </span>
            <span className="text-textMuted"> {unitLabel(unit)} × </span>
            <span className="font-semibold tabular-nums">{set.reps}</span>
          </>
        ) : (
          <>
            <span className="font-semibold tabular-nums">{set.reps}</span>
            <span className="text-textMuted"> {set.reps === 1 ? 'rep' : 'reps'}</span>
          </>
        )}
      </span>

      <div className="flex items-center gap-2">
        {isPr && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accentLime/15 px-2 py-0.5 text-[11px] font-bold text-accentLime">
            <Trophy className="h-3 w-3" />
            PR
          </span>
        )}
        {set.completed && (
          <Check className="h-4 w-4 text-primary" strokeWidth={3} />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-0.5 font-display text-base font-semibold tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}
