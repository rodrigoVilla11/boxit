'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { RoutineForm, type RoutineDraftItem } from '@/components/routines/routine-form';
import { getRoutine, updateRoutine } from '@/lib/routines';

export default function EditarRutinaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<{ name: string; items: RoutineDraftItem[] } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
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
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 pb-16 text-center">
        <p className="text-sm text-textMuted">No encontramos esta rutina.</p>
        <button onClick={() => router.push('/rutinas')} className="font-semibold text-primary">
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
