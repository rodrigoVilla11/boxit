'use client';

import { useState } from 'react';
import { History, Link2, MoreVertical, Plus, Replace, Trash2, Unlink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Menu, MenuItem } from '@/components/ui/menu';
import { ExerciseHistorySheet } from '@/components/progress/exercise-history-sheet';
import { SetRow } from './set-row';
import { useUnit } from '@/components/unit-provider';
import { kgToDisplay, roundDisplay, unitLabel } from '@/lib/units';
import { muscleLabel } from '@/lib/labels';
import { bestPrSetId } from '@/lib/prs';
import type { SupersetInfo } from '@/lib/superset';
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
  onReplaceExercise,
  onReorderSets,
  superset,
  canGroupNext,
  onGroupWithNext,
  onUngroup,
}: {
  we: WorkoutExercise;
  previous: PreviousSession;
  record?: PersonalRecord;
  dragHandle?: React.ReactNode;
  onSaveSet: (setId: string, patch: SetPatch) => void;
  onAddSet: (workoutExerciseId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: (workoutExerciseId: string) => void;
  onReplaceExercise: (workoutExerciseId: string) => void;
  onReorderSets: (workoutExerciseId: string, ids: string[]) => void;
  superset: SupersetInfo;
  canGroupNext: boolean;
  onGroupWithNext: (workoutExerciseId: string) => void;
  onUngroup: (workoutExerciseId: string) => void;
}) {
  const { unit } = useUnit();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Guía de la rutina (si el entreno salió de una): "Meta 8-12 reps · 80 kg"
  const targetText = [
    we.targetReps
      ? `${we.targetReps}${we.targetRepsMax ? `-${we.targetRepsMax}` : ''} reps`
      : '',
    we.targetWeight
      ? `${roundDisplay(kgToDisplay(we.targetWeight, unit))} ${unitLabel(unit)}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

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
    <section
      className={cn(
        'rounded-2xl bg-surface p-3 shadow-card',
        superset.letter && 'border-l-4 border-primary',
      )}
    >
      <header className="flex items-start justify-between px-1 pb-2">
        <div className="flex min-w-0 items-start gap-1">
          {dragHandle}
          <div className="min-w-0">
            {superset.letter && (
              <span className="mb-1 inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                <Link2 className="h-3 w-3" />
                Superserie {superset.letter}
              </span>
            )}
            <h3 className="font-display text-base font-semibold text-primary">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label={`Ver historial de ${we.exercise.name}`}
                className="flex max-w-full items-center gap-1.5 text-left"
              >
                <span className="min-w-0 break-words">{we.exercise.name}</span>
                <History className="h-3.5 w-3.5 shrink-0 text-textMuted" />
              </button>
            </h3>
            <p className="text-xs text-textMuted">
              {muscleLabel(we.exercise.primaryMuscle)}
            </p>
            {targetText && (
              <p className="text-[11px] font-medium text-primary/80">Meta {targetText}</p>
            )}
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
          <MenuItem onClick={() => onReplaceExercise(we.id)}>
            <Replace className="h-4 w-4" />
            Reemplazar ejercicio
          </MenuItem>
          {superset.letter ? (
            <MenuItem onClick={() => onUngroup(we.id)}>
              <Unlink className="h-4 w-4" />
              Quitar de la superserie
            </MenuItem>
          ) : canGroupNext ? (
            <MenuItem onClick={() => onGroupWithNext(we.id)}>
              <Link2 className="h-4 w-4" />
              Agrupar con el siguiente
            </MenuItem>
          ) : null}
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
            target={{ weight: we.targetWeight, reps: we.targetReps }}
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
