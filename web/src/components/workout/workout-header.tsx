'use client';

import { LogOut, MoreVertical, Timer, Trash2 } from 'lucide-react';
import { Menu, MenuItem } from '@/components/ui/menu';
import { useNow } from '@/hooks/use-now';
import { useUnit } from '@/components/unit-provider';
import { formatDuration } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { liveTotals, type Workout } from '@/lib/workouts';

export function WorkoutHeader({
  workout,
  finishing,
  onFinish,
  onDiscard,
  onLogout,
}: {
  workout: Workout;
  finishing: boolean;
  onFinish: () => void;
  onDiscard: () => void;
  onLogout: () => void;
}) {
  const now = useNow(1000);
  const { unit } = useUnit();
  const elapsed = Math.floor((now - new Date(workout.startedAt).getTime()) / 1000);
  const totals = liveTotals(workout);

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-white/5 bg-ink/95 px-4 pb-3 pt-safe backdrop-blur">
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2 text-primary">
          <Timer className="h-5 w-5" />
          <span className="font-display text-2xl font-bold tabular-nums tracking-tight">
            {formatDuration(elapsed)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFinish}
            disabled={finishing}
            className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-ink transition hover:bg-primary-deep disabled:opacity-60"
          >
            Terminar
          </button>
          <Menu
            label="Más opciones"
            trigger={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text">
                <MoreVertical className="h-5 w-5" />
              </span>
            }
          >
            <MenuItem danger onClick={onDiscard}>
              <Trash2 className="h-4 w-4" />
              Descartar entreno
            </MenuItem>
            <MenuItem onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Duración" value={formatDuration(elapsed)} />
        <Metric label="Volumen" value={formatVolume(totals.volume, unit)} />
        <Metric label="Series" value={String(totals.sets)} />
      </div>
    </header>
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
