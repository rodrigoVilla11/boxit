'use client';

import { useState } from 'react';
import { History, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { Menu, MenuItem } from '@/components/ui/menu';
import { ExerciseHistorySheet } from '@/components/progress/exercise-history-sheet';
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
  dragHandle,
  onSaveSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onReorderSets,
}: {
  we: WorkoutExercise;
  previous: PreviousSession;
  record?: PersonalRecord;
  dragHandle?: React.ReactNode;
  onSaveSet: (setId: string, patch: SetPatch) => void;
  onAddSet: (workoutExerciseId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: (workoutExerciseId: string) => void;
  onReorderSets: (workoutExerciseId: string, ids: string[]) => void;
}) {
  const { unit } = useUnit();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Serie que ostenta el récord en vivo (una sola insignia por ejercicio)
  const prSetId = bestPrSetId(we.sets, record);

  // Mueve una serie una posición (arriba/abajo) reordenando toda la lista.
  const moveSet = (setId: string, dir: -1 | 1) => {
    const ids = we.sets.map((s) => s.id);
    const i = ids.indexOf(setId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    onReorderSets(we.id, ids);
  };

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
        <div className="flex min-w-0 items-start gap-1">
          {dragHandle}
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-primary">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label={`Ver historial de ${we.exercise.name}`}
                className="flex max-w-full items-center gap-1.5 text-left"
              >
                <span className="truncate">{we.exercise.name}</span>
                <History className="h-3.5 w-3.5 shrink-0 text-textMuted" />
              </button>
            </h3>
            <p className="text-xs text-textMuted">
              {muscleLabel(we.exercise.primaryMuscle)}
            </p>
          </div>
        </div>
        <Menu
          label="Opciones del ejercicio"
          trigger={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:text-text">
              <MoreVertical className="h-5 w-5" />
            </span>
          }
        >
          <MenuItem onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4" />
            Ver historial
          </MenuItem>
          <MenuItem danger onClick={() => onRemoveExercise(we.id)}>
            <Trash2 className="h-4 w-4" />
            Quitar ejercicio
          </MenuItem>
        </Menu>
      </header>

      {/* Encabezado de columnas */}
      <div className="grid grid-cols-[2.25rem_1fr_5rem_4rem_2.75rem] gap-2 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-textMuted">
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
            onMoveUp={i > 0 ? () => moveSet(set.id, -1) : undefined}
            onMoveDown={
              i < we.sets.length - 1 ? () => moveSet(set.id, 1) : undefined
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddSet(we.id)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surfaceRaised py-2.5 text-sm font-medium text-textMuted transition hover:text-text active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        Agregar serie
      </button>

      {historyOpen && (
        <ExerciseHistorySheet
          exerciseId={we.exerciseId}
          exerciseName={we.exercise.name}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </section>
  );
}
