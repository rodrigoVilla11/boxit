'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import { plural } from '@/lib/plural';
import { getExercises, type Exercise } from '@/lib/workouts';
import {
  ROUTINE_TEMPLATES,
  createFromTemplate,
  type RoutineTemplate,
} from '@/lib/routine-templates';
import type { Routine } from '@/lib/routines';

const CATEGORIES: RoutineTemplate['category'][] = [
  'Push / Pull / Legs',
  'Upper / Lower',
  'Full Body',
];

export function TemplatePicker({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (routine: Routine) => void;
}) {
  useLockBody(true);
  const toast = useToast();
  const [library, setLibrary] = useState<Exercise[] | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    getExercises()
      .then(setLibrary)
      .catch(() => setLibrary([]));
  }, []);

  async function pick(t: RoutineTemplate) {
    if (creating || !library) return;
    setCreating(t.id);
    try {
      const routine = await createFromTemplate(t, library);
      toast.success('Rutina creada desde plantilla.');
      onCreated(routine);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear.');
      setCreating(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Plantillas de rutina"
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="flex items-center justify-between px-4 pt-safe">
        <h2 className="mt-4 flex items-center gap-2 font-display text-lg font-bold text-text">
          <Sparkles className="h-5 w-5 text-primary" />
          Plantillas
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        <p className="mb-3 mt-1 text-sm text-textMuted">
          Empezá con una rutina armada. La podés editar después.
        </p>
        {library === null ? (
          <div className="flex justify-center py-16 text-textMuted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          CATEGORIES.map((cat) => (
            <section key={cat} className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-textMuted">
                {cat}
              </h3>
              <div className="space-y-2">
                {ROUTINE_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t)}
                    disabled={!!creating}
                    className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-card transition active:scale-[0.99] disabled:opacity-60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-semibold text-text">
                        {t.name}
                      </p>
                      <p className="text-xs text-textMuted">
                        {t.summary} · {plural(t.exercises.length, 'ejercicio', 'ejercicios')}
                      </p>
                    </div>
                    {creating === t.id ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="shrink-0 rounded-xl bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
                        Usar
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
