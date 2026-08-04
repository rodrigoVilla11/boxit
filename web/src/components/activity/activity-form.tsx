'use client';

import { useState } from 'react';
import { Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { formatDuration } from '@/lib/format';
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
} from './interval-editor';
import {
  createActivity,
  updateActivity,
  type Activity,
  type ActivityInput,
  type ActivityType,
} from '@/lib/activities';

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Siembra el formulario sin entrar en modo edición (plan del día / plantilla). */
export type ActivityPrefill = {
  type?: ActivityType;
  targetDistanceM?: number | null;
  targetDurationSec?: number | null;
  label?: string | null;
  intervals?: {
    label: string | null;
    reps: number;
    distanceM: number | null;
    durationSec: number | null;
    restSec: number | null;
  }[];
};

export function ActivityForm({
  initial,
  prefill,
  onClose,
  onSaved,
}: {
  initial: Activity | null;
  // siembra los campos SIN entrar en modo edición (para "hoy toca")
  prefill?: ActivityPrefill;
  onClose: () => void;
  onSaved: (a: Activity) => void;
}) {
  const editing = !!initial;
  const toast = useToast();
  const sw = useStopwatch();
  useLockBody(true);

  const startType = initial?.type ?? prefill?.type ?? 'RUN';
  const startDurationSec = initial?.durationSec ?? prefill?.targetDurationSec ?? 0;
  const startDistanceM = initial?.distanceM ?? prefill?.targetDistanceM ?? 0;

  const [type, setType] = useState<ActivityType>(startType);
  const [label, setLabel] = useState(initial?.label ?? prefill?.label ?? '');
  const [date, setDate] = useState(() =>
    (initial?.performedAt ?? new Date().toISOString()).slice(0, 10),
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const [intervals, setIntervals] = useState<IntervalRow[]>(() =>
    intervalRows(initial?.intervals ?? prefill?.intervals),
  );
  const [saving, setSaving] = useState(false);

  const unit = activityDistanceUnit(type) ?? 'm';
  // distancia total en la unidad del tipo (km/m)
  const [distance, setDistance] = useState(() => {
    if (!startDistanceM) return '';
    const u = activityDistanceUnit(startType) ?? 'm';
    return u === 'km' ? String(startDistanceM / 1000) : String(startDistanceM);
  });
  const [min, setMin] = useState(() =>
    startDurationSec ? String(Math.floor(startDurationSec / 60)) : '',
  );
  const [sec, setSec] = useState(() =>
    startDurationSec ? String(startDurationSec % 60).padStart(2, '0') : '',
  );

  const distanceM = () =>
    Math.round(num(distance) * (unit === 'km' ? 1000 : 1));
  const durationSec = () => num(min) * 60 + num(sec);

  // Prefila los totales sumando los intervalos (ayuda, no obligatorio)
  function sumIntervals() {
    const { distanceM: dM, durationSec: dS } = intervalTotals(intervals);
    if (dM > 0) setDistance(unit === 'km' ? String(dM / 1000) : String(dM));
    if (dS > 0) {
      setMin(String(Math.floor(dS / 60)));
      setSec(String(Math.round(dS % 60)).padStart(2, '0'));
    }
  }

  function useStopwatchTime() {
    setMin(String(Math.floor(sw.elapsedSec / 60)));
    setSec(String(sw.elapsedSec % 60).padStart(2, '0'));
  }

  async function save() {
    const dM = distanceM();
    const dS = durationSec();
    if (dM <= 0 && dS <= 0) {
      toast.error('Cargá al menos distancia o tiempo.');
      return;
    }
    setSaving(true);
    const input: ActivityInput = {
      type,
      label: label.trim() || null,
      performedAt: new Date(`${date}T12:00:00`).toISOString(),
      distanceM: dM,
      durationSec: dS,
      note: note.trim() || null,
      intervals: toIntervalInputs(intervals),
    };
    try {
      const saved = editing
        ? await updateActivity(initial!.id, input)
        : await createActivity(input);
      sw.reset();
      onSaved(saved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos guardar la actividad.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Editar actividad' : 'Nueva actividad'}
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            {editing ? 'Editar actividad' : 'Nueva actividad'}
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

        {/* Cronómetro */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
          <Timer className="h-5 w-5 shrink-0 text-primary" />
          <span className="flex-1 font-display text-2xl font-bold tabular-nums text-text">
            {formatDuration(sw.elapsedSec)}
          </span>
          {sw.running ? (
            <button
              type="button"
              onClick={sw.pause}
              aria-label="Pausar"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={sw.start}
              aria-label="Iniciar"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-ink active:scale-95"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={sw.reset}
            aria-label="Reiniciar cronómetro"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-textMuted active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={useStopwatchTime}
            className="h-9 rounded-xl bg-surfaceRaised px-3 text-xs font-semibold text-primary active:scale-95"
          >
            Usar tiempo
          </button>
        </div>

        {/* Distancia + tiempo */}
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
              aria-label={`Distancia en ${unit}`}
              className="h-12 w-full rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
            />
          </label>
          <div className="block">
            <span className="mb-1.5 block text-sm font-medium text-textMuted">
              Tiempo
            </span>
            <div className="flex items-center gap-1">
              <input
                inputMode="numeric"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="min"
                aria-label="Minutos"
                className="h-12 w-full rounded-2xl bg-surfaceRaised px-3 text-center text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
              />
              <span className="text-textMuted">:</span>
              <input
                inputMode="numeric"
                value={sec}
                onChange={(e) => setSec(e.target.value)}
                placeholder="seg"
                aria-label="Segundos"
                className="h-12 w-full rounded-2xl bg-surfaceRaised px-3 text-center text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Fecha + nombre */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-textMuted">Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Fecha"
              className="h-12 w-full rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-primary"
            />
          </label>
          <TextField
            label="Nombre (opcional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Fondo domingo"
            maxLength={80}
          />
        </div>

        {/* Intervalos */}
        <IntervalEditor
          rows={intervals}
          onChange={setIntervals}
          action={
            <button
              type="button"
              onClick={sumIntervals}
              className="text-xs font-semibold text-primary active:scale-95"
            >
              Sumar a totales
            </button>
          }
        />

        {/* Nota */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-textMuted">Nota</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sensaciones, clima, circuito…"
            rows={3}
            maxLength={280}
            className="w-full rounded-2xl bg-surfaceRaised px-4 py-3 text-base text-text outline-none ring-1 ring-white/5 placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button onClick={save} loading={saving}>
          {editing ? 'Guardar cambios' : 'Guardar actividad'}
        </Button>
      </div>
    </div>
  );
}
