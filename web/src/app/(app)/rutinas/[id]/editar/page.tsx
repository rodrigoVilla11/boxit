'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { RoutineForm, type RoutineDraftItem } from '@/components/routines/routine-form';
import { ErrorState } from '@/components/ui/error-state';
import { getRoutine, updateRoutine } from '@/lib/routines';

export default function EditarRutinaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<{ name: string; items: RoutineDraftItem[] } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setInitial(null);
    getRoutine(id)
      .then((r) =>
        setInitial({
          name: r.name,
          items: r.exercises.map((e) => ({
            exercise: e.exercise,
            targetSets: e.targetSets,
          })),
        }),
      )
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 pb-16 text-center">
        <ErrorState message="No pudimos cargar esta rutina." onRetry={load} />
        <button
          onClick={() => router.push('/rutinas')}
          className="text-sm font-semibold text-textMuted transition hover:text-text"
        >
          Volver a rutinas
        </button>
      </div>
    );
  }

  if (!initial) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-textMuted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <RoutineForm
      title="Editar rutina"
      submitLabel="Guardar"
      initial={initial}
      onSubmit={(name, exercises) => updateRoutine(id, name, exercises).then(() => undefined)}
    />
  );
}
