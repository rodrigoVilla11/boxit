'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import { useUnit } from '@/components/unit-provider';
import { displayToKg, kgToDisplay, roundDisplay, unitLabel } from '@/lib/units';
import { SEX_OPTIONS, ageFrom, bmi, bmiLabel } from '@/lib/profile';
import { updateProfile, type SessionUser, type Sex } from '@/lib/auth';
import { createBodyweight, type Bodyweight } from '@/lib/bodyweight';

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Edición del perfil. El peso y el % de grasa no viven en el usuario: cargarlos
 * acá crea un registro nuevo en el historial de peso corporal (el mismo que
 * alimenta el gráfico de Progreso).
 */
export function ProfileForm({
  user,
  latest,
  onClose,
  onSaved,
}: {
  user: SessionUser;
  latest: Bodyweight | null;
  onClose: () => void;
  onSaved: (user: SessionUser, entry: Bodyweight | null) => void;
}) {
  const toast = useToast();
  const { unit } = useUnit();
  useLockBody(true);

  const [name, setName] = useState(user.name);
  const [sex, setSex] = useState<Sex | null>(user.sex);
  const [birthDate, setBirthDate] = useState(user.birthDate ?? '');
  const [heightCm, setHeightCm] = useState(
    user.heightCm ? String(user.heightCm) : '',
  );
  const [goal, setGoal] = useState(
    user.goalWeightKg ? String(roundDisplay(kgToDisplay(user.goalWeightKg, unit))) : '',
  );
  const [weight, setWeight] = useState(
    latest ? String(roundDisplay(kgToDisplay(latest.weightKg, unit))) : '',
  );
  const [fat, setFat] = useState(latest?.bodyFatPct ? String(latest.bodyFatPct) : '');
  const [saving, setSaving] = useState(false);

  const age = ageFrom(birthDate || null);
  const weightKg = weight ? displayToKg(num(weight), unit) : null;
  const imc = bmi(weightKg, num(heightCm) || null);

  // Sólo registramos una pesada nueva si cambió el peso o el % de grasa.
  const weightChanged =
    !!weightKg &&
    (!latest ||
      Math.abs(weightKg - latest.weightKg) > 0.01 ||
      (num(fat) || null) !== latest.bodyFatPct);

  async function save() {
    if (name.trim().length < 2) {
      toast.error('El nombre es muy corto.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        sex,
        birthDate: birthDate || null,
        heightCm: num(heightCm) || null,
        goalWeightKg: goal ? displayToKg(num(goal), unit) : null,
      });
      let entry: Bodyweight | null = null;
      if (weightChanged && weightKg) {
        entry = await createBodyweight({
          weightKg,
          bodyFatPct: num(fat) || null,
        });
      }
      onSaved(updated, entry);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos guardar tu perfil.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar perfil"
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            Editar perfil
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="name"
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-textMuted">Sexo</span>
          <div className="flex flex-wrap gap-1.5">
            {SEX_OPTIONS.map((o) => {
              const on = sex === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  // volver a tocar la opción activa la deselecciona
                  onClick={() => setSex(on ? null : o.value)}
                  aria-pressed={on}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition active:scale-95',
                    on
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                      : 'bg-surfaceRaised text-textMuted hover:text-text',
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-textMuted">
              Nacimiento
            </span>
            <input
              type="date"
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirthDate(e.target.value)}
              aria-label="Fecha de nacimiento"
              className="h-12 w-full rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
            />
            {age !== null && (
              <span className="mt-1 block text-xs text-textMuted">{age} años</span>
            )}
          </label>
          <TextField
            label="Estatura (cm)"
            inputMode="decimal"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="175"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={`Peso actual (${unitLabel(unit)})`}
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
          />
          <TextField
            label="Grasa corporal (%)"
            inputMode="decimal"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="0"
          />
        </div>
        <p className="-mt-3 text-xs text-textMuted">
          {weightChanged
            ? 'Se va a guardar como una medición nueva en tu historial de peso.'
            : 'El peso y la grasa quedan registrados con fecha, así ves la evolución en Progreso.'}
        </p>

        <TextField
          label={`Objetivo de peso (${unitLabel(unit)})`}
          inputMode="decimal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Opcional"
        />

        {imc !== null && (
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-textMuted">IMC</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-text">
              {imc}
              <span className="ml-2 text-sm font-normal text-textMuted">
                {bmiLabel(imc)}
              </span>
            </p>
          </div>
        )}

        <Button onClick={save} loading={saving}>
          Guardar perfil
        </Button>
      </div>
    </div>
  );
}
