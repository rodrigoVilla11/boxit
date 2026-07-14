'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration, formatVolume } from '@/lib/format';
import type { Workout } from '@/lib/workouts';

export function FinishSummary({
  workout,
  onClose,
}: {
  workout: Workout;
  onClose: () => void;
}) {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center px-6 pb-safe pt-safe text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 ring-1 ring-primary/30">
        <CheckCircle2 className="h-9 w-9 text-primary" />
      </div>
      <h1 className="font-display text-2xl font-bold text-text">¡Entreno terminado!</h1>
      <p className="mt-1 text-sm text-textMuted">Buen laburo. Así quedó:</p>

      <div className="mt-8 grid w-full grid-cols-3 gap-2">
        <Stat label="Duración" value={formatDuration(workout.durationSec)} />
        <Stat label="Volumen" value={formatVolume(workout.totalVolume)} />
        <Stat label="Series" value={String(workout.totalSets)} />
      </div>

      <div className="mt-10 w-full">
        <Button onClick={onClose}>Listo</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3 shadow-card">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular-nums text-accentLime">
        {value}
      </p>
    </div>
  );
}
