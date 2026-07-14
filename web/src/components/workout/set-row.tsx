'use client';

import { useState } from 'react';
import { Check, Flame, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Menu, MenuItem } from '@/components/ui/menu';
import type { PreviousSet, SetPatch, WorkoutSet } from '@/lib/workouts';

const parseFloatSafe = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const parseIntSafe = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

export function SetRow({
  index,
  set,
  previous,
  onSave,
  onRemove,
  onToggleWarmup,
}: {
  index: number;
  set: WorkoutSet;
  previous?: PreviousSet;
  onSave: (setId: string, patch: SetPatch) => void;
  onRemove: (setId: string) => void;
  onToggleWarmup: (setId: string, warmup: boolean) => void;
}) {
  const [weight, setWeight] = useState(set.weight ? String(set.weight) : '');
  const [reps, setReps] = useState(set.reps ? String(set.reps) : '');

  const isWarmup = set.type === 'WARMUP';

  const persist = () =>
    onSave(set.id, { weight: parseFloatSafe(weight), reps: parseIntSafe(reps) });

  const toggleComplete = () =>
    onSave(set.id, {
      completed: !set.completed,
      weight: parseFloatSafe(weight),
      reps: parseIntSafe(reps),
    });

  const prevText = previous ? `${previous.weight}×${previous.reps}` : '—';

  return (
    <div
      className={cn(
        'grid grid-cols-[2rem_1fr_4.25rem_3.25rem_2.5rem] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
        set.completed && 'row-done',
      )}
    >
      {/* Serie / menú (warmup, eliminar) */}
      <Menu
        align="left"
        label="Opciones de la serie"
        trigger={
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold',
              isWarmup
                ? 'bg-accentLime/15 text-accentLime'
                : 'bg-surfaceRaised text-textMuted',
            )}
          >
            {isWarmup ? 'W' : index + 1}
          </span>
        }
      >
        <MenuItem onClick={() => onToggleWarmup(set.id, !isWarmup)}>
          <Flame className="h-4 w-4" />
          {isWarmup ? 'Volver a normal' : 'Convertir en warmup'}
        </MenuItem>
        <MenuItem danger onClick={() => onRemove(set.id)}>
          <Trash2 className="h-4 w-4" />
          Eliminar serie
        </MenuItem>
      </Menu>

      {/* Anterior */}
      <span className="truncate text-xs text-textMuted">{prevText}</span>

      {/* Kg */}
      <input
        inputMode="decimal"
        value={weight}
        placeholder={previous ? String(previous.weight) : '0'}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={persist}
        aria-label={`Kg serie ${index + 1}`}
        className="h-9 w-full rounded-lg bg-surfaceRaised text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Reps */}
      <input
        inputMode="numeric"
        value={reps}
        placeholder={previous ? String(previous.reps) : '0'}
        onChange={(e) => setReps(e.target.value)}
        onBlur={persist}
        aria-label={`Reps serie ${index + 1}`}
        className="h-9 w-full rounded-lg bg-surfaceRaised text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Completar */}
      <button
        type="button"
        onClick={toggleComplete}
        aria-label={set.completed ? 'Desmarcar serie' : 'Completar serie'}
        aria-pressed={set.completed}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg transition',
          set.completed
            ? 'bg-primary text-ink'
            : 'bg-surfaceRaised text-textMuted hover:text-text',
        )}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>
    </div>
  );
}
