'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Dumbbell, History, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { plural } from '@/lib/plural';
import { formatSessionDate } from '@/lib/format';
import { formatVolume, unitLabel, weightValue } from '@/lib/units';
import { useUnit } from '@/components/unit-provider';
import { useLockBody } from '@/hooks/use-lock-body';
import { ErrorState } from '@/components/ui/error-state';
import {
  getExerciseSessions,
  type ExerciseSession,
  type ExerciseSessionSet,
} from '@/lib/progress';

/**
 * Historial completo de un ejercicio: cada día que lo entrenaste con todas las
 * series (peso, reps, RPE, nota). Se abre desde el entreno en curso y desde
 * la tarjeta de progresión.
 */
export function ExerciseHistorySheet({
  exerciseId,
  exerciseName,
  onClose,
}: {
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
}) {
  const [sessions, setSessions] = useState<ExerciseSession[] | null>(null);
  const [error, setError] = useState(false);

  useLockBody(true);

  const load = useCallback(() => {
    setError(false);
    setSessions(null);
    getExerciseSessions(exerciseId)
      .then(setSessions)
      .catch(() => setError(true));
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Historial de ${exerciseName}`}
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-2 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-display text-lg font-semibold text-text">
              {exerciseName}
            </h2>
            <p className="text-sm text-textMuted">Historial por sesión</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-safe pt-4">
        {error ? (
          <ErrorState message="No pudimos cargar el historial." onRetry={load} />
        ) : sessions === null ? (
          <div className="flex justify-center py-16 text-textMuted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-textMuted">
              <History className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-text">Sin sesiones todavía</p>
            <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
              Cuando termines un entreno con este ejercicio, va a aparecer acá.
            </p>
          </div>
        ) : (
          sessions.map((s) => <SessionBlock key={s.workoutId} session={s} />)
        )}
      </div>
    </div>
  );
}

function SessionBlock({ session }: { session: ExerciseSession }) {
  const { unit } = useUnit();
  const working = session.sets.filter((s) => s.type === 'NORMAL');
  const top =
    session.topWeight > 0
      ? `${weightValue(session.topWeight, unit)} ${unitLabel(unit)} × ${session.topReps}`
      : `${session.topReps} reps`;

  return (
    <section className="rounded-2xl bg-surface p-3 shadow-card">
      <Link
        href={`/historial/${session.workoutId}`}
        className="flex items-center gap-2 px-1 pb-2"
      >
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-text">
            {formatSessionDate(session.performedAt)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted">
            <span className="font-semibold text-primary">{top}</span>
            {session.volume > 0 && (
              <span className="inline-flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5" />
                {formatVolume(session.volume, unit)}
              </span>
            )}
            <span>{plural(working.length, 'serie', 'series')}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-textMuted" />
      </Link>

      <div className="space-y-1">
        {session.sets.map((set, i) => (
          <HistorySetRow
            key={`${session.workoutId}-${set.order}`}
            // el número visible cuenta sólo series de trabajo (los warmups son "W")
            index={session.sets.slice(0, i).filter((x) => x.type === 'NORMAL').length}
            set={set}
          />
        ))}
      </div>
    </section>
  );
}

function HistorySetRow({ index, set }: { index: number; set: ExerciseSessionSet }) {
  const { unit } = useUnit();
  const isWarmup = set.type === 'WARMUP';
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-2 py-1.5',
        isWarmup && 'opacity-60',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
          isWarmup
            ? 'bg-accentLime/15 text-accentLime'
            : 'bg-surfaceRaised text-textMuted',
        )}
      >
        {isWarmup ? 'W' : index + 1}
      </span>

      <span className="min-w-0 flex-1 text-sm text-text">
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
        {set.note?.trim() && (
          <span className="ml-2 text-xs text-textMuted">{set.note}</span>
        )}
      </span>

      {set.rpe != null && (
        <span className="shrink-0 text-xs font-semibold text-accentLime">
          RPE {set.rpe}
        </span>
      )}
    </div>
  );
}
