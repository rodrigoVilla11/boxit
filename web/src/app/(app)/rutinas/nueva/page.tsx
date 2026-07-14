'use client';

import { RoutineForm } from '@/components/routines/routine-form';
import { createRoutine } from '@/lib/routines';

export default function NuevaRutinaPage() {
  return (
    <RoutineForm
      title="Nueva rutina"
      submitLabel="Guardar"
      onSubmit={(name, exercises) => createRoutine(name, exercises).then(() => undefined)}
    />
  );
}
