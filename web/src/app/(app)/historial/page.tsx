'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Dumbbell, History, Loader2, Timer, Trophy } from 'lucide-react';
import { formatDuration, formatSessionDate, formatVolume } from '@/lib/format';
import {
  getHistory,
  getPersonalRecords,
  type PersonalRecord,
  type WorkoutSummary,
} from '@/lib/workouts';

export default function HistorialPage() {
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);

  useEffect(() => {
    getHistory()
      .then(setWorkouts)
      .catch(() => setWorkouts([]));
    getPersonalRecords()
      .then(setPrs)
      .catch(() => setPrs([]));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Historial</h1>
      </header>

      {workouts === null ? (
        <div className="flex justify-center py-16 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-5 space-y-6">
          {prs.length > 0 && <RecordsSection prs={prs} />}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-textMuted">
              {workouts.length} {workouts.length === 1 ? 'entreno' : 'entrenos'}
            </h2>
            {workouts.map((w) => (
              <SessionCard key={w.id} workout={w} />
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

function RecordsSection({ prs }: { prs: PersonalRecord[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accentLime" />
        <h2 className="text-sm font-semibold text-text">Récords</h2>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {prs.map((pr) => (
          <div
            key={pr.exerciseId}
            className="min-w-[9.5rem] shrink-0 rounded-2xl border border-accentLime/25 bg-surface p-3"
          >
            <p className="truncate text-xs text-textMuted">{pr.exerciseName}</p>
            <p className="mt-1 font-display text-lg font-bold text-accentLime">
              {pr.weight} kg
            </p>
            <p className="text-[11px] text-textMuted">{pr.reps} reps</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionCard({ workout }: { workout: WorkoutSummary }) {
  const preview = workout.exercises.map((e) => e.exercise.name).join(' · ');
  return (
    <Link
      href={`/historial/${workout.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card transition active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-text">
          {formatSessionDate(workout.finishedAt)}
        </p>
        <p className="mt-0.5 line-clamp-1 text-sm text-textMuted">
          {preview || 'Sin ejercicios'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted">
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" />
            {formatVolume(workout.totalVolume)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {formatDuration(workout.durationSec)}
          </span>
          <span>{workout.totalSets} series</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-textMuted" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-textMuted">
        <History className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-text">Todavía no registraste entrenos</p>
      <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
        Cuando termines tu primer entreno, va a aparecer acá con tu volumen y tus PRs.
      </p>
      <Link
        href="/entreno"
        className="mt-5 flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-ink transition hover:bg-primary-deep"
      >
        <Dumbbell className="h-5 w-5" />
        Ir a entrenar
      </Link>
    </div>
  );
}
