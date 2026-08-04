'use client';

import { Pencil, Target } from 'lucide-react';
import { useUnit } from '@/components/unit-provider';
import { formatWeight, roundDisplay } from '@/lib/units';
import {
  ageFrom,
  bmi,
  bmiLabel,
  formatBodyFat,
  leanMassKg,
  sexLabel,
} from '@/lib/profile';
import type { SessionUser } from '@/lib/auth';
import type { Bodyweight } from '@/lib/bodyweight';

/** Resumen del perfil: identidad + métricas derivadas de la última pesada. */
export function ProfileCard({
  user,
  latest,
  onEdit,
}: {
  user: SessionUser;
  latest: Bodyweight | null;
  onEdit: () => void;
}) {
  const { unit } = useUnit();
  const age = ageFrom(user.birthDate);
  const imc = bmi(latest?.weightKg ?? null, user.heightCm);
  const lean = leanMassKg(latest?.weightKg ?? null, latest?.bodyFatPct ?? null);
  const toGoal =
    user.goalWeightKg && latest ? latest.weightKg - user.goalWeightKg : null;

  const meta = [
    age !== null ? `${age} años` : '',
    user.sex ? sexLabel(user.sex) : '',
    user.heightCm ? `${roundDisplay(user.heightCm)} cm` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-text">
            {user.name}
          </p>
          <p className="truncate text-sm text-textMuted">{user.email}</p>
          {meta && <p className="mt-1 truncate text-sm text-textMuted">{meta}</p>}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar perfil"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-textMuted transition hover:text-text active:scale-95"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {(latest || imc !== null) && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat
            label="Peso"
            value={latest ? formatWeight(latest.weightKg, unit) : '—'}
          />
          <Stat label="Grasa" value={formatBodyFat(latest?.bodyFatPct) || '—'} />
          <Stat label="IMC" value={imc !== null ? String(imc) : '—'} hint={bmiLabel(imc)} />
        </div>
      )}

      {(lean !== null || toGoal !== null) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-textMuted">
          {lean !== null && (
            <span>
              Masa magra{' '}
              <span className="font-semibold text-text">
                {formatWeight(lean, unit)}
              </span>
            </span>
          )}
          {toGoal !== null && (
            <span className="inline-flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {Math.abs(toGoal) < 0.1 ? (
                <span className="font-semibold text-primary">¡Objetivo alcanzado!</span>
              ) : (
                <>
                  {toGoal > 0 ? 'Faltan' : 'Te pasaste por'}{' '}
                  <span className="font-semibold text-text">
                    {formatWeight(Math.abs(toGoal), unit)}
                  </span>{' '}
                  para tu objetivo
                </>
              )}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-surfaceRaised px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-0.5 truncate font-display text-base font-semibold tabular-nums text-text">
        {value}
      </p>
      {hint && <p className="truncate text-[10px] text-textMuted">{hint}</p>}
    </div>
  );
}
