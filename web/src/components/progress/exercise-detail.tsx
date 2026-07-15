'use client';

import { Pencil, Trash2, X } from 'lucide-react';
import { BodyDiagram } from './body-diagram';
import { VideoPlayer } from './video-player';
import { highlightColor } from '@/lib/muscle-color';
import { equipmentLabel, muscleLabel } from '@/lib/labels';
import type { MuscleKey } from '@/lib/progress';
import type { Exercise } from '@/lib/workouts';

export function ExerciseDetail({
  exercise,
  onClose,
  onEdit,
  onDelete,
}: {
  exercise: Exercise | null;
  onClose: () => void;
  onEdit?: (e: Exercise) => void;
  onDelete?: (e: Exercise) => void;
}) {
  if (!exercise) return null;

  const secondary = new Set(exercise.secondaryMuscles);
  const colorFor = (m: MuscleKey): string =>
    m === exercise.primaryMuscle
      ? highlightColor('primary')
      : secondary.has(m)
        ? highlightColor('secondary')
        : highlightColor('none');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-2 pt-4">
          <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-text">
            {exercise.name}
          </h2>
          {exercise.editable && (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(exercise)}
                aria-label="Editar"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-primary"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(exercise)}
                aria-label="Eliminar"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-danger"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-textMuted">
          {muscleLabel(exercise.primaryMuscle)} · {equipmentLabel(exercise.equipment)}
          {exercise.editable && ' · propio'}
        </p>
      </header>

      <div className="app-shell w-full flex-1 space-y-4 overflow-y-auto px-4 pb-safe pt-4">
        <div className="flex items-start justify-center gap-4 rounded-2xl bg-surface p-4">
          <BodyDiagram view="front" colorFor={colorFor} label="Frente" />
          <BodyDiagram view="back" colorFor={colorFor} label="Espalda" />
        </div>

        <div className="flex items-center justify-center gap-5 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: highlightColor('primary') }} />
            <span className="text-text">Primario</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: highlightColor('secondary') }} />
            <span className="text-textMuted">Secundario</span>
          </span>
        </div>

        {exercise.description && (
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-textMuted">Cómo se hace</p>
            <p className="mt-1.5 text-sm leading-relaxed text-text">
              {exercise.description}
            </p>
          </div>
        )}

        {exercise.videoUrl && <VideoPlayer url={exercise.videoUrl} />}

        <div className="space-y-2">
          <div className="rounded-xl bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-textMuted">Primario</p>
            <p className="mt-0.5 font-medium text-text">
              {muscleLabel(exercise.primaryMuscle)}
            </p>
          </div>
          {exercise.secondaryMuscles.length > 0 && (
            <div className="rounded-xl bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-textMuted">Secundarios</p>
              <p className="mt-0.5 font-medium text-text">
                {exercise.secondaryMuscles.map((m) => muscleLabel(m)).join(' · ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
