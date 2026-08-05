'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/toast-provider';
import { cn } from '@/lib/cn';
import { displayToKg } from '@/lib/units';
import { updateProfile } from '@/lib/auth';
import { getExercises, type Exercise } from '@/lib/workouts';
import {
  ROUTINE_TEMPLATES,
  createFromTemplate,
  type RoutineTemplate,
} from '@/lib/routine-templates';

type Unit = 'KG' | 'LB';

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [unit, setUnit] = useState<Unit>('KG');
  const [goal, setGoal] = useState('');
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getExercises()
      .then(setLibrary)
      .catch(() => undefined);
  }, []);

  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      const goalNum = parseFloat(goal.replace(',', '.'));
      const goalWeightKg =
        Number.isFinite(goalNum) && goalNum > 0 ? displayToKg(goalNum, unit) : null;
      await updateProfile({ weightUnit: unit, goalWeightKg, onboarded: true });
      if (template && library.length) {
        await createFromTemplate(template, library).catch(() => undefined);
      }
      router.replace('/entreno');
      router.refresh();
    } catch {
      toast.error('No se pudo guardar. Probá de nuevo.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-ink px-6 pb-10 pt-safe">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 ring-1 ring-primary/30">
            <BrandMark className="text-2xl" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text">
            ¡Bienvenido a BOX iT!
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            Configurá un par de cosas y arrancamos.
          </p>
        </div>

        {/* Unidad */}
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-text">Unidad de peso</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['KG', 'LB'] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  'h-12 rounded-2xl text-sm font-semibold transition active:scale-95',
                  u === unit ? 'bg-primary text-ink' : 'bg-surface text-textMuted',
                )}
              >
                {u === 'KG' ? 'Kilos (kg)' : 'Libras (lb)'}
              </button>
            ))}
          </div>
        </section>

        {/* Objetivo de peso */}
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-text">
            Objetivo de peso <span className="font-normal text-textMuted">(opcional)</span>
          </h2>
          <div className="flex items-center gap-2 rounded-2xl bg-surface px-3">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              inputMode="decimal"
              placeholder="Ej: 75"
              aria-label="Objetivo de peso"
              className="h-12 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-textMuted/70"
            />
            <span className="text-sm text-textMuted">{unit === 'KG' ? 'kg' : 'lb'}</span>
          </div>
        </section>

        {/* Primera rutina */}
        <section className="mt-5">
          <h2 className="mb-1 text-sm font-semibold text-text">
            Primera rutina <span className="font-normal text-textMuted">(opcional)</span>
          </h2>
          <p className="mb-2 text-xs text-textMuted">
            Empezá con una armada; la editás cuando quieras.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROUTINE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate((cur) => (cur?.id === t.id ? null : t))}
                className={cn(
                  'rounded-2xl p-3 text-left transition active:scale-[0.98]',
                  template?.id === t.id
                    ? 'bg-primary/15 ring-1 ring-primary'
                    : 'bg-surface',
                )}
              >
                <p className="text-sm font-semibold text-text">{t.name}</p>
                <p className="text-[11px] text-textMuted">{t.summary}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-8">
          <Button onClick={finish} loading={busy}>
            Empezar a entrenar
          </Button>
        </div>
      </div>
    </div>
  );
}
