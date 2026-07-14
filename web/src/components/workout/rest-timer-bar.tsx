'use client';

import { Plus, Timer, X } from 'lucide-react';
import { formatDuration } from '@/lib/format';

export function RestTimerBar({
  seconds,
  onAdd,
  onSkip,
}: {
  seconds: number;
  onAdd: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem_+_env(safe-area-inset-bottom))] z-30 px-4">
      <div className="app-shell pointer-events-auto flex items-center gap-3 rounded-2xl border border-primary/30 bg-surfaceRaised/95 px-4 py-2.5 shadow-glow backdrop-blur">
        <Timer className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-textMuted">Descanso</p>
          <p className="font-display text-lg font-bold tabular-nums leading-none text-primary">
            {formatDuration(seconds)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1 rounded-xl bg-primary/15 px-3 text-sm font-semibold text-primary transition hover:bg-primary/25"
        >
          <Plus className="h-4 w-4" />
          15s
        </button>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Saltar descanso"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
