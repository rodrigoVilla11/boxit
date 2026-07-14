'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, ChevronLeft, Loader2, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { muscleLabel } from '@/lib/labels';
import { formatDuration, formatSessionDate, formatVolume } from '@/lib/format';
import {
  getPersonalRecords,
  getWorkoutById,
  type Workout,
  type WorkoutSet,
} from '@/lib/workouts';

export default function SessionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [prByExercise, setPrByExercise] = useState<Record<string, number>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getWorkoutById(id)
      .then(setWorkout)
      .catch(() => setNotFound(true));
    getPersonalRecords()
      .then((prs) =>
        setPrByExercise(
          Object.fromEntries(prs.map((p) => [p.exerciseId, p.weight])),
        ),
      )
      .catch(() => {});
  }, [id]);

  if (notFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 pb-16 text-center">
        <p className="text-sm text-textMuted">No encontramos este entreno.</p>
        <button onClick={() => router.push('/historial')} className="font-semibold text-primary">
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
        <Metric label="Volumen" value={formatVolume(workout.totalVolume)} />
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
                    isPr={
                      set.completed &&
                      set.type === 'NORMAL' &&
                      set.weight > 0 &&
                      record !== undefined &&
                      set.weight === record
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
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
        <span className="font-semibold tabular-nums">{set.weight}</span>
        <span className="text-textMuted"> kg × </span>
        <span className="font-semibold tabular-nums">{set.reps}</span>
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
