'use client';

import { useEffect, useState } from 'react';
import { Globe, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getMe } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SwitchVisual } from '@/components/ui/switch';
import { useLockBody } from '@/hooks/use-lock-body';
import {
  EQUIPMENT_KEYS,
  MUSCLE_KEYS,
  equipmentLabel,
  muscleLabel,
} from '@/lib/labels';
import {
  createExercise,
  updateExercise,
  type Exercise,
  type ExerciseInput,
} from '@/lib/workouts';

export function ExerciseForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Exercise | null;
  onClose: () => void;
  onSaved: (e: Exercise) => void;
}) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [primary, setPrimary] = useState(initial?.primaryMuscle ?? MUSCLE_KEYS[0]);
  const [secondary, setSecondary] = useState<string[]>(
    initial?.secondaryMuscles ?? [],
  );
  const [equipment, setEquipment] = useState(initial?.equipment ?? EQUIPMENT_KEYS[0]);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [global, setGlobal] = useState(true);

  useLockBody(true);

  useEffect(() => {
    getMe()
      .then((u) => setIsAdmin(!!u?.isAdmin))
      .catch(() => {});
  }, []);

  const canSave = name.trim().length >= 2 && !saving;

  function toggleSecondary(m: string) {
    setSecondary((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  async function save() {
    setError(null);
    setSaving(true);
    const input: ExerciseInput = {
      name: name.trim(),
      primaryMuscle: primary,
      secondaryMuscles: secondary.filter((m) => m !== primary),
      equipment,
      description: description.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      global: !editing && isAdmin ? global : undefined,
    };
    try {
      const saved = editing
        ? await updateExercise(initial!.id, input)
        : await createExercise(input);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      setSaving(false);
    }
  }

  const selectClass =
    'h-11 w-full appearance-none rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            {editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Press Arnold"
          maxLength={60}
          autoFocus={!editing}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textMuted">
            Músculo primario
          </label>
          <select
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className={selectClass}
          >
            {MUSCLE_KEYS.map((m) => (
              <option key={m} value={m}>
                {muscleLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textMuted">
            Músculos secundarios
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_KEYS.filter((m) => m !== primary).map((m) => {
              const on = secondary.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleSecondary(m)}
                  aria-pressed={on}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm transition active:scale-95',
                    on
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                      : 'bg-surfaceRaised text-textMuted hover:text-text',
                  )}
                >
                  {muscleLabel(m)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textMuted">
            Equipo
          </label>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className={selectClass}
          >
            {EQUIPMENT_KEYS.map((eq) => (
              <option key={eq} value={eq}>
                {equipmentLabel(eq)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textMuted">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cómo se hace, tips de técnica…"
            rows={4}
            maxLength={600}
            className="w-full rounded-2xl bg-surfaceRaised px-4 py-3 text-base text-text outline-none ring-1 ring-white/5 placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
          />
        </div>

        <TextField
          label="Video (URL de YouTube o mp4)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          type="url"
          inputMode="url"
          placeholder="https://youtube.com/watch?v=…"
        />

        {isAdmin && !editing && (
          <button
            type="button"
            onClick={() => setGlobal((g) => !g)}
            aria-pressed={global}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition active:scale-[0.99]"
          >
            <Globe className="h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text">
                Global (para todos)
              </span>
              <span className="block text-xs text-textMuted">
                Como admin, se agrega a la librería de todos los usuarios.
              </span>
            </span>
            <SwitchVisual on={global} />
          </button>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button onClick={save} loading={saving} disabled={!canSave}>
          {editing ? 'Guardar cambios' : 'Crear ejercicio'}
        </Button>
      </div>
    </div>
  );
}
