'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Dumbbell, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { muscleLabel } from '@/lib/labels';
import { createRoutine } from '@/lib/routines';
import type { Exercise } from '@/lib/workouts';

type DraftItem = { key: string; exercise: Exercise; targetSets: number };

export default function NuevaRutinaPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && items.length > 0 && !saving;

  function addExercise(exercise: Exercise) {
    setItems((prev) => [
      ...prev,
      { key: `${exercise.id}-${prev.length}-${exercise.name}`, exercise, targetSets: 3 },
    ]);
  }

  function setSets(key: string, delta: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.key === key
          ? { ...it, targetSets: Math.min(20, Math.max(1, it.targetSets + delta)) }
          : it,
      ),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      await createRoutine(
        name.trim(),
        items.map((it) => ({ exerciseId: it.exercise.id, targetSets: it.targetSets })),
      );
      router.push('/rutinas');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 pt-safe">
        <div className="flex items-center gap-1 pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:text-text"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="font-display text-xl font-bold text-text">Nueva rutina</h1>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="mt-5 h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-ink transition hover:bg-primary-deep disabled:opacity-40"
        >
          Guardar
        </button>
      </header>

      <div className="mt-5 space-y-4">
        <TextField
          label="Nombre de la rutina"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Push A, Pierna, Full body…"
          maxLength={60}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.key}
              className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">{it.exercise.name}</p>
                <p className="text-xs text-textMuted">
                  {muscleLabel(it.exercise.primaryMuscle)}
                </p>
              </div>

              {/* Stepper de series */}
              <div className="flex items-center gap-2 rounded-xl bg-surfaceRaised p-1">
                <button
                  type="button"
                  onClick={() => setSets(it.key, -1)}
                  aria-label="Menos series"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-textMuted hover:text-text"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm tabular-nums text-text">
                  {it.targetSets}
                  <span className="text-textMuted"> ser.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSets(it.key, 1)}
                  aria-label="Más series"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-textMuted hover:text-text"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeItem(it.key)}
                aria-label="Quitar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
              <Dumbbell className="h-6 w-6 text-textMuted" />
              <p className="text-sm text-textMuted">Agregá ejercicios a la rutina.</p>
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={() => setPickerOpen(true)}>
          <Plus className="h-5 w-5" />
          Agregar ejercicio
        </Button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        closeOnPick={false}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
      />
    </div>
  );
}
