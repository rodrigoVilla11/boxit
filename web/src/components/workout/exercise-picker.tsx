'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dumbbell, Loader2, Search, X } from 'lucide-react';
import { getExercises, type Exercise } from '@/lib/workouts';
import { equipmentLabel, muscleLabel } from '@/lib/labels';

const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function ExercisePicker({
  open,
  onClose,
  onPick,
  closeOnPick = true,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void | Promise<void>;
  closeOnPick?: boolean;
}) {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    if (items === null) {
      getExercises()
        .then(setItems)
        .catch(() => setItems([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(
      (e) =>
        normalize(e.name).includes(q) ||
        normalize(muscleLabel(e.primaryMuscle)).includes(q),
    );
  }, [items, query]);

  async function pick(exercise: Exercise) {
    setAdding(exercise.id);
    try {
      await onPick(exercise);
      if (closeOnPick) onClose();
    } finally {
      setAdding(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink">
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            Agregar ejercicio
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
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ejercicio o músculo…"
            className="h-11 w-full rounded-2xl bg-surfaceRaised pl-9 pr-4 text-base text-text outline-none ring-1 ring-white/5 placeholder:text-textMuted/50 focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      <div className="app-shell w-full flex-1 overflow-y-auto px-4 pb-safe pt-3">
        {items === null ? (
          <div className="flex justify-center py-10 text-textMuted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-textMuted">
            No encontramos ejercicios.
          </p>
        ) : (
          <ul className="space-y-1.5 pb-6">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => pick(e)}
                  disabled={adding !== null}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-accentLime">
                    {adding === e.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Dumbbell className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text">
                      {e.name}
                    </span>
                    <span className="block truncate text-xs text-textMuted">
                      {muscleLabel(e.primaryMuscle)} · {equipmentLabel(e.equipment)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
