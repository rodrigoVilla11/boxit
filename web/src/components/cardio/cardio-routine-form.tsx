'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import {
  ACTIVITY_TYPES,
  activityDistanceUnit,
  activityIcon,
  activityLabel,
} from '@/lib/activity';
import {
  IntervalEditor,
  intervalRows,
  intervalTotals,
  toIntervalInputs,
  type IntervalRow,
} from '@/components/activity/interval-editor';
import {
  createCardioRoutine,
  updateCardioRoutine,
  type CardioRoutine,
} from '@/lib/cardio-routines';
import type { ActivityType } from '@/lib/activities';

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Alta/edición de una plantilla de cardio: el objetivo puede ser por distancia,
 * por tiempo, o por intervalos (o una combinación).
 */
export function CardioRoutineForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: CardioRoutine | null;
  onClose: () => void;
  onSaved: (r: CardioRoutine) => void;
}) {
  const editing = !!initial;
  const toast = useToast();
  useLockBody(true);

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<ActivityType>(initial?.type ?? 'RUN');
  const [note, setNote] = useState(initial?.note ?? '');
  const [intervals, setIntervals] = useState<IntervalRow[]>(() =>
    intervalRows(initial?.intervals),
  );
  const [saving, setSaving] = useState(false);

  const unit = activityDistanceUnit(type) ?? 'm';
  const [distance, setDistance] = useState(() => {
    const m = initial?.targetDistanceM;
    if (!m) return '';
    const u = activityDistanceUnit(initial.type) ?? 'm';
    return u === 'km' ? String(m / 1000) : String(m);
  });
  const [min, setMin] = useState(() =>
    initial?.targetDurationSec ? String(Math.round(initial.targetDurationSec / 60)) : '',
  );

  // Los intervalos ya describen el trabajo: esto sólo prefila el objetivo total.
  function sumIntervals() {
    const { distanceM, durationSec } = intervalTotals(intervals);
    if (distanceM > 0) {
      setDistance(unit === 'km' ? String(distanceM / 1000) : String(distanceM));
    }
    if (durationSec > 0) setMin(String(Math.round(durationSec / 60)));
  }

  async function save() {
    if (!name.trim()) {
      toast.error('Poné un nombre a la plantilla.');
      return;
    }
    const distanceM = Math.round(num(distance) * (unit === 'km' ? 1000 : 1));
    const durationSec = Math.round(num(min) * 60);
    if (distanceM <= 0 && durationSec <= 0 && intervals.length === 0) {
      toast.error('Cargá una distancia, un tiempo o algún intervalo.');
      return;
    }
    setSaving(true);
    const input = {
      name: name.trim(),
      type,
      targetDistanceM: distanceM || null,
      targetDurationSec: durationSec || null,
      note: note.trim() || null,
      intervals: toIntervalInputs(intervals),
    };
    try {
      const saved = editing
        ? await updateCardioRoutine(initial.id, input)
        : await createCardioRoutine(input);
      onSaved(saved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos guardar la plantilla.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Editar plantilla de cardio' : 'Nueva plantilla de cardio'}
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            {editing ? 'Editar plantilla' : 'Nueva plantilla de cardio'}
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
          placeholder="Ej: Series 8×400, Fondo 10 km…"
          maxLength={60}
        />

        {/* Tipo */}
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((t) => {
            const Icon = activityIcon(t);
            const on = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={on}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition active:scale-95',
                  on
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                    : 'bg-surfaceRaised text-textMuted hover:text-text',
                )}
              >
                <Icon className="h-4 w-4" />
                {activityLabel(t)}
              </button>
            );
          })}
        </div>

        {/* Objetivo total */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-textMuted">
              Distancia ({unit})
            </span>
            <input
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0"
              aria-label={`Distancia objetivo en ${unit}`}
              className="h-12 w-full rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-textMuted">
              Minutos
            </span>
            <input
              inputMode="numeric"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="0"
              aria-label="Minutos objetivo"
              className="h-12 w-full rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
        <p className="-mt-3 text-xs text-textMuted">
          Podés dejar el objetivo total vacío y describir todo con intervalos.
        </p>

        <IntervalEditor
          rows={intervals}
          onChange={setIntervals}
          action={
            <button
              type="button"
              onClick={sumIntervals}
              className="text-xs font-semibold text-primary active:scale-95"
            >
              Sumar a objetivo
            </button>
          }
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textMuted">Nota</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ritmo objetivo, circuito, sensaciones…"
            rows={3}
            maxLength={280}
            className="w-full rounded-2xl bg-surfaceRaised px-4 py-3 text-base text-text outline-none ring-1 ring-white/5 placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button onClick={save} loading={saving}>
          {editing ? 'Guardar cambios' : 'Crear plantilla'}
        </Button>
      </div>
    </div>
  );
}
