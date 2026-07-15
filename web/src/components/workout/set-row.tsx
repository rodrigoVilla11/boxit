'use client';

import { useEffect, useState } from 'react';
import { Check, Flame, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Menu, MenuItem } from '@/components/ui/menu';
import { useUnit } from '@/components/unit-provider';
import { displayToKg, kgToDisplay, roundDisplay, weightInputValue } from '@/lib/units';
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
  const { unit } = useUnit();
  const [weight, setWeight] = useState(() => weightInputValue(set.weight, unit));
  const [reps, setReps] = useState(set.reps ? String(set.reps) : '');

  // Sincroniza los inputs con el server: al cambiar de unidad, y cuando el valor
  // guardado cambia (eco de un guardado ok o rollback tras un error).
  useEffect(() => {
    setWeight(weightInputValue(set.weight, unit));
    setReps(set.reps ? String(set.reps) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, set.weight, set.reps]);

  const isWarmup = set.type === 'WARMUP';

  // El input está en la unidad de display; guardamos siempre en kg.
  const persist = () =>
    onSave(set.id, {
      weight: displayToKg(parseFloatSafe(weight), unit),
      reps: parseIntSafe(reps),
    });

  const toggleComplete = () =>
    onSave(set.id, {
      completed: !set.completed,
      weight: displayToKg(parseFloatSafe(weight), unit),
      reps: parseIntSafe(reps),
    });

  const prevText = previous
    ? `${roundDisplay(kgToDisplay(previous.weight, unit))}×${previous.reps}`
    : '—';
  const prevPlaceholder = previous
    ? String(roundDisplay(kgToDisplay(previous.weight, unit)))
    : '0';

  return (
    <div
      className={cn(
        'grid grid-cols-[2rem_1fr_4.25rem_3.25rem_2.5rem] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
        set.completed && 'row-done',
      )}
    >
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

      <span className="truncate text-xs text-textMuted">{prevText}</span>

      <input
        inputMode="decimal"
        value={weight}
        placeholder={prevPlaceholder}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={persist}
        aria-label={`Peso serie ${index + 1}`}
        className="h-9 w-full rounded-lg bg-surfaceRaised text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />

      <input
        inputMode="numeric"
        value={reps}
        placeholder={previous ? String(previous.reps) : '0'}
        onChange={(e) => setReps(e.target.value)}
        onBlur={persist}
        aria-label={`Reps serie ${index + 1}`}
        className="h-9 w-full rounded-lg bg-surfaceRaised text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />

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
