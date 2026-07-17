'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Loader2, MoreVertical, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { Menu, MenuItem } from '@/components/ui/menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { plural } from '@/lib/plural';
import { deleteRoutine, getRoutines, startRoutine, type Routine } from '@/lib/routines';

export default function RutinasPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [toDelete, setToDelete] = useState<Routine | null>(null);

  const load = useCallback(() => {
    setLoadError(false);
    setRoutines(null);
    getRoutines()
      .then(setRoutines)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onStart(routine: Routine) {
    setError(null);
    setStarting(routine.id);
    try {
      await startRoutine(routine.id);
      router.push('/entreno');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo empezar.');
      setStarting(null);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    setRoutines((rs) => (rs ? rs.filter((r) => r.id !== id) : rs));
    try {
      await deleteRoutine(id);
    } catch {
      // si falla, recargamos
      getRoutines().then(setRoutines).catch(() => {});
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Rutinas</h1>
        <Link
          href="/rutinas/nueva"
          className="mt-6 flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-ink transition hover:bg-primary-deep"
        >
          <Plus className="h-4 w-4" />
          Crear
        </Link>
      </header>

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <span>{error}</span>
          <Link href="/entreno" className="font-semibold underline">
            Ir al entreno
          </Link>
        </div>
      )}

      <div className="mt-4 flex-1 space-y-3">
        {loadError ? (
          <ErrorState message="No pudimos cargar tus rutinas." onRetry={load} />
        ) : routines === null ? (
          <div className="flex justify-center py-16 text-textMuted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : routines.length === 0 ? (
          <EmptyState />
        ) : (
          routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              starting={starting === routine.id}
              disabled={starting !== null}
              onStart={() => onStart(routine)}
              onEdit={() => router.push(`/rutinas/${routine.id}/editar`)}
              onDelete={() => setToDelete(routine)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar rutina?"
        message={`Se va a eliminar "${toDelete?.name ?? ''}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function RoutineCard({
  routine,
  starting,
  disabled,
  onStart,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  starting: boolean;
  disabled: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalSets = routine.exercises.reduce((a, e) => a + e.targetSets, 0);
  const preview = routine.exercises.map((e) => e.exercise.name).join(' · ');

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-text">
          {routine.name}
        </h2>
        <Menu
          label="Opciones de la rutina"
          trigger={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:text-text">
              <MoreVertical className="h-5 w-5" />
            </span>
          }
        >
          <MenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar rutina
          </MenuItem>
          <MenuItem danger onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Eliminar rutina
          </MenuItem>
        </Menu>
      </div>

      <p className="mt-0.5 line-clamp-2 text-sm text-textMuted">{preview}</p>
      <p className="mt-2 text-xs text-textMuted">
        {plural(routine.exercises.length, 'ejercicio', 'ejercicios')} ·{' '}
        {plural(totalSets, 'serie', 'series')}
      </p>

      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/15 py-2.5 font-semibold text-primary transition hover:bg-primary/25 disabled:opacity-60"
      >
        {starting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className="h-5 w-5" />
        )}
        Empezar entreno
      </button>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-textMuted">
        <ClipboardList className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-text">Todavía no tenés rutinas</p>
      <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
        Creá una plantilla y empezá tus entrenos más rápido.
      </p>
      <Link
        href="/rutinas/nueva"
        className="mt-5 flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-ink transition hover:bg-primary-deep"
      >
        <Plus className="h-5 w-5" />
        Crear rutina
      </Link>
    </div>
  );
}
