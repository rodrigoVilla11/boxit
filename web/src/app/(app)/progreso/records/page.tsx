'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Dumbbell, Loader2, Trophy } from 'lucide-react';
import { useUnit } from '@/components/unit-provider';
import { ErrorState } from '@/components/ui/error-state';
import { unitLabel, weightValue } from '@/lib/units';
import { plural } from '@/lib/plural';
import { getRecords, type ExerciseRecords, type RecordEntry } from '@/lib/workouts';

export default function RecordsPage() {
  const router = useRouter();
  const { unit } = useUnit();
  const [records, setRecords] = useState<ExerciseRecords[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setRecords(null);
    getRecords()
      .then(setRecords)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-1 pt-safe">
        <button
          type="button"
          onClick={() => router.push('/progreso')}
          aria-label="Volver"
          className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:text-text"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="mt-5 font-display text-xl font-bold text-text">Récords</h1>
      </header>

      {error ? (
        <ErrorState message="No pudimos cargar tus récords." onRetry={load} />
      ) : records === null ? (
        <div className="flex justify-center py-16 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-surface">
            <Trophy className="h-7 w-7 text-textMuted" />
          </div>
          <p className="text-sm text-textMuted">
            Todavía no hay récords. Terminá un entreno con series cargadas y van a
            aparecer acá.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 pb-4">
          {records.map((r) => (
            <RecordCard key={r.exerciseId} r={r} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ r, unit }: { r: ExerciseRecords; unit: 'KG' | 'LB' }) {
  const w = (kg: number) => `${weightValue(kg, unit)} ${unitLabel(unit)}`;
  return (
    <section className="rounded-2xl bg-surface p-3 shadow-card">
      <header className="mb-2 flex items-center gap-2 px-1">
        <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 break-words font-display text-base font-semibold text-text">
          {r.exerciseName}
        </h2>
      </header>
      {r.hasWeight ? (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Peso máximo" value={r.topWeight ? w(r.topWeight.weight) : '—'} sub={detail(r.topWeight)} />
          <Stat label="1RM estimado" value={r.topE1rm ? w(r.topE1rm.value) : '—'} />
          <Stat label="Volumen de serie" value={r.topVolume ? w(r.topVolume.value) : '—'} sub={detail(r.topVolume)} />
          <Stat label="Más reps" value={r.topReps ? String(r.topReps.reps) : '—'} sub={r.topReps ? w(r.topReps.weight) : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-1">
          <Stat
            label="Mejor serie"
            value={r.topReps ? plural(r.topReps.reps, 'rep', 'reps') : '—'}
          />
        </div>
      )}
    </section>
  );
}

/** "80 kg × 8" para dar contexto de la serie que logró el récord. */
function detail(e: RecordEntry | null): string | undefined {
  if (!e) return undefined;
  return `${e.reps} ${e.reps === 1 ? 'rep' : 'reps'}`;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surfaceRaised px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-0.5 font-display text-base font-bold tabular-nums text-accentLime">
        {value}
      </p>
      {sub && <p className="text-[11px] text-textMuted">{sub}</p>}
    </div>
  );
}
