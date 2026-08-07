'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Dumbbell, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { useUnit } from '@/components/unit-provider';
import { displayToKg, kgToDisplay, roundDisplay, unitLabel } from '@/lib/units';
import { muscleLabel } from '@/lib/labels';
import type { RoutineExerciseInput } from '@/lib/routines';
import type { Exercise } from '@/lib/workouts';

export type RoutineDraftItem = {
  exercise: Exercise;
  targetSets: number;
  // targetReps = valor único o mínimo del rango; targetRepsMax = tope (null = único)
  targetReps?: number | null;
  targetRepsMax?: number | null;
  targetWeight?: number | null; // siempre en kg
  // Campos sin UI propia: se preservan tal cual al editar (restSeconds, note, superserie)
  restSeconds?: number | null;
  note?: string | null;
  supersetGroup?: number | null;
};

let keySeq = 0;
// Reps y peso viven como texto mientras se edita (permite vacío y decimales a medias);
// el peso se muestra en la unidad del usuario y se convierte a kg al guardar.
type Item = {
  key: string;
  exercise: Exercise;
  targetSets: number;
  repsMin: string;
  repsMax: string;
  weight: string;
  restSeconds: number | null;
  note: string | null;
  supersetGroup: number | null;
};

const intOrNull = (s: string): number | null => {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(1000, n) : null;
};
const floatOrNull = (s: string): number | null => {
  const n = Number.parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const numberInputCls =
  'h-9 w-full min-w-0 rounded-xl bg-surfaceRaised px-1 text-center text-sm text-text outline-none ring-1 ring-white/5 placeholder:text-textMuted/50 focus:ring-2 focus:ring-primary';

export function RoutineForm({
  title,
  submitLabel,
  initial,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initial?: { name: string; items: RoutineDraftItem[] };
  onSubmit: (name: string, exercises: RoutineExerciseInput[]) => Promise<void>;
}) {
  const router = useRouter();
  const { unit } = useUnit();
  const [name, setName] = useState(initial?.name ?? '');
  const [items, setItems] = useState<Item[]>(() =>
    (initial?.items ?? []).map((it) => ({
      key: `k${keySeq++}`,
      exercise: it.exercise,
      targetSets: it.targetSets,
      repsMin: it.targetReps != null ? String(it.targetReps) : '',
      repsMax: it.targetRepsMax != null ? String(it.targetRepsMax) : '',
      weight:
        it.targetWeight != null
          ? String(roundDisplay(kgToDisplay(it.targetWeight, unit)))
          : '',
      restSeconds: it.restSeconds ?? null,
      note: it.note ?? null,
      supersetGroup: it.supersetGroup ?? null,
    })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && items.length > 0 && !saving;

  function addExercise(exercise: Exercise) {
    setItems((prev) => [
      ...prev,
      {
        key: `k${keySeq++}`,
        exercise,
        targetSets: 3,
        repsMin: '',
        repsMax: '',
        weight: '',
        restSeconds: null,
        note: null,
        supersetGroup: null,
      },
    ]);
  }
  function patchItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
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

  function toInput(it: Item): RoutineExerciseInput {
    // Normaliza el rango: solo máximo → valor único; invertido → se da vuelta;
    // min = max → valor único.
    let repsMin = intOrNull(it.repsMin);
    let repsMax = intOrNull(it.repsMax);
    if (repsMin === null && repsMax !== null) {
      repsMin = repsMax;
      repsMax = null;
    }
    if (repsMin !== null && repsMax !== null) {
      if (repsMax < repsMin) [repsMin, repsMax] = [repsMax, repsMin];
      if (repsMax === repsMin) repsMax = null;
    }
    const w = floatOrNull(it.weight);
    return {
      exerciseId: it.exercise.id,
      targetSets: it.targetSets,
      supersetGroup: it.supersetGroup,
      targetReps: repsMin,
      targetRepsMax: repsMax,
      targetWeight: w !== null ? Math.min(2000, displayToKg(w, unit)) : null,
      restSeconds: it.restSeconds,
      note: it.note,
    };
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await onSubmit(name.trim(), items.map(toInput));
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
          <h1 className="font-display text-xl font-bold text-text">{title}</h1>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="mt-5 flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-ink transition hover:bg-primary-deep active:scale-95 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Guardando…' : submitLabel}
        </button>
      </header>

      <div className="mt-5 space-y-4">
        <TextField
          label="Nombre de la rutina"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSave) save();
          }}
          enterKeyHint="done"
          placeholder="Ej: Push A, Pierna, Full body…"
          maxLength={60}
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.key} className="rounded-2xl bg-surface p-3 shadow-card">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{it.exercise.name}</p>
                  <p className="text-xs text-textMuted">
                    {muscleLabel(it.exercise.primaryMuscle)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(it.key)}
                  aria-label="Quitar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-textMuted hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex items-end gap-2">
                <div className="shrink-0">
                  <p className="mb-1 text-[11px] font-medium text-textMuted">Series</p>
                  <div className="flex items-center rounded-xl bg-surfaceRaised p-0.5">
                    <button
                      type="button"
                      onClick={() => setSets(it.key, -1)}
                      aria-label="Menos series"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums text-text">
                      {it.targetSets}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSets(it.key, 1)}
                      aria-label="Más series"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="min-w-0 flex-[1.3]">
                  <p className="mb-1 text-[11px] font-medium text-textMuted">Reps</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={it.repsMin}
                      onChange={(e) =>
                        patchItem(it.key, {
                          repsMin: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      placeholder="mín"
                      aria-label="Reps mínimas"
                      className={numberInputCls}
                    />
                    <span className="shrink-0 text-textMuted">–</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={it.repsMax}
                      onChange={(e) =>
                        patchItem(it.key, {
                          repsMax: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      placeholder="máx"
                      aria-label="Reps máximas"
                      className={numberInputCls}
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[11px] font-medium text-textMuted">
                    Peso ({unitLabel(unit)})
                  </p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={it.weight}
                    onChange={(e) =>
                      patchItem(it.key, {
                        weight: e.target.value.replace(/[^\d.,]/g, '').slice(0, 7),
                      })
                    }
                    placeholder="—"
                    aria-label="Peso objetivo"
                    className={numberInputCls}
                  />
                </div>
              </div>
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
        selectedIds={items.map((it) => it.exercise.id)}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
      />
    </div>
  );
}
