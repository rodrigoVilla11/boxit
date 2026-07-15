'use client';

import { MoreVertical, Plus, Trash2 } from 'lucide-react';
import { Menu, MenuItem } from '@/components/ui/menu';
import { SetRow } from './set-row';
import { useUnit } from '@/components/unit-provider';
import { unitLabel } from '@/lib/units';
import { muscleLabel } from '@/lib/labels';
import { bestPrSetId } from '@/lib/prs';
import type {
  PersonalRecord,
  PreviousSession,
  SetPatch,
  WorkoutExercise,
} from '@/lib/workouts';

export function ExerciseCard({
  we,
  previous,
  record,
  onSaveSet,
  onAddSet,
  onRemoveSet,
  onToggleWarmup,
  onRemoveExercise,
}: {
  we: WorkoutExercise;
  previous: PreviousSession;
  record?: PersonalRecord;
  onSaveSet: (setId: string, patch: SetPatch) => void;
  onAddSet: (workoutExerciseId: string) => void;
  onRemoveSet: (setId: string) => void;
  onToggleWarmup: (setId: string, warmup: boolean) => void;
  onRemoveExercise: (workoutExerciseId: string) => void;
}) {
  const { unit } = useUnit();

  // Serie que ostenta el récord en vivo (una sola insignia por ejercicio)
  const prSetId = bestPrSetId(we.sets, record);

  // "Anterior" se alinea por serie de TRABAJO (NORMAL), no por índice de fila:
  // la n-ésima serie normal actual se compara con la n-ésima de la sesión previa;
  // los warmups no muestran anterior.
  const prevWorking = (previous?.sets ?? []).filter((s) => s.type === 'NORMAL');
  let workingCount = -1;
  const previousForRow = we.sets.map((set) => {
    if (set.type !== 'NORMAL') return undefined;
    workingCount += 1;
    return prevWorking[workingCount];
  });

  return (
    <section className="rounded-2xl bg-surface p-3 shadow-card">
      <header className="flex items-start justify-between px-1 pb-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-primary">
            {we.exercise.name}
          </h3>
          <p className="text-xs text-textMuted">
            {muscleLabel(we.exercise.primaryMuscle)}
          </p>
        </div>
        <Menu
          label="Opciones del ejercicio"
          trigger={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:text-text">
              <MoreVertical className="h-5 w-5" />
            </span>
          }
        >
          <MenuItem danger onClick={() => onRemoveExercise(we.id)}>
            <Trash2 className="h-4 w-4" />
            Quitar ejercicio
          </MenuItem>
        </Menu>
      </header>

      {/* Encabezado de columnas */}
      <div className="grid grid-cols-[2rem_1fr_4.25rem_3.25rem_2.5rem] gap-2 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-textMuted">
        <span>Serie</span>
        <span>Anterior</span>
        <span className="text-center">{unitLabel(unit)}</span>
        <span className="text-center">Reps</span>
        <span aria-hidden />
      </div>

      <div className="space-y-1">
        {we.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i}
            set={set}
            previous={previousForRow[i]}
            isPr={set.id === prSetId}
            onSave={onSaveSet}
            onRemove={onRemoveSet}
            onToggleWarmup={onToggleWarmup}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddSet(we.id)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surfaceRaised py-2 text-sm font-medium text-textMuted transition hover:text-text"
      >
        <Plus className="h-4 w-4" />
        Agregar serie
      </button>
    </section>
  );
}
