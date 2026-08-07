'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, Info, Loader2, Plus, Search, X } from 'lucide-react';
import { deleteExercise, getExercises, type Exercise } from '@/lib/workouts';
import { equipmentLabel, muscleLabel } from '@/lib/labels';
import { ExerciseDetail } from '@/components/progress/exercise-detail';
import { ExerciseForm } from '@/components/progress/exercise-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLockBody } from '@/hooks/use-lock-body';

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
  selectedIds,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void | Promise<void>;
  closeOnPick?: boolean;
  selectedIds?: string[];
}) {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Exercise | null>(null);
  const [toDelete, setToDelete] = useState<Exercise | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useLockBody(open);

  function reload() {
    getExercises().then(setItems).catch(() => {});
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const ex = toDelete;
    setToDelete(null);
    try {
      await deleteExercise(ex.id);
      setDetail(null);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
  }

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

  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Agregar ejercicio"
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
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
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ejercicio o músculo…"
            aria-label="Buscar ejercicio o músculo"
            className="h-11 w-full rounded-2xl bg-surfaceRaised pl-9 pr-4 text-base text-text outline-none ring-1 ring-white/5 placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      <div className="app-shell w-full flex-1 overflow-y-auto overscroll-contain px-4 pb-safe pt-3">
        <button
          type="button"
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/15 py-2.5 font-semibold text-primary transition hover:bg-primary/25 active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" />
          Crear ejercicio
        </button>

        {notice && (
          <p className="mb-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {notice}
          </p>
        )}

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
              <li key={e.id} className="flex items-center gap-1 rounded-2xl bg-surface pr-1">
                <button
                  type="button"
                  onClick={() => pick(e)}
                  disabled={adding !== null}
                  className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition active:scale-[0.99] disabled:opacity-60"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selected.has(e.id)
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surfaceRaised text-accentLime'
                    }`}
                  >
                    {adding === e.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : selected.has(e.id) ? (
                      <Check className="h-5 w-5" />
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
                <button
                  type="button"
                  onClick={() => setDetail(e)}
                  aria-label="Ver músculos"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-textMuted transition hover:text-primary"
                >
                  <Info className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!closeOnPick && (
        <div className="app-shell w-full px-4 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="mb-4 mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-ink transition hover:bg-primary-deep active:scale-[0.99]"
          >
            <Check className="h-5 w-5" />
            Listo
            {(selectedIds?.length ?? 0) > 0 &&
              ` · ${selectedIds!.length} ejercicio${selectedIds!.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      <ExerciseDetail
        exercise={detail}
        onClose={() => setDetail(null)}
        onEdit={(e) => {
          setDetail(null);
          setFormInitial(e);
          setFormOpen(true);
        }}
        onDelete={(e) => setToDelete(e)}
      />

      {formOpen && (
        <ExerciseForm
          initial={formInitial}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice(null);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar ejercicio?"
        message={`Se va a eliminar "${toDelete?.name ?? ''}".`}
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
