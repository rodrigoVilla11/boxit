'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  StickyNote,
  Trash2,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Menu, MenuItem } from '@/components/ui/menu';
import { useUnit } from '@/components/unit-provider';
import { PlateCalculator } from './plate-calculator';
import { displayToKg, kgToDisplay, roundDisplay, weightInputValue } from '@/lib/units';
import type { PreviousSet, SetPatch, WorkoutSet } from '@/lib/workouts';

const RPE_OPTIONS = [6, 7, 8, 9, 10];

const parseFloatSafe = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const parseIntSafe = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

export function SetRow({
  index,
  set,
  previous,
  isPr = false,
  onSave,
  onRemove,
  onToggleWarmup,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  set: WorkoutSet;
  previous?: PreviousSet;
  isPr?: boolean;
  onSave: (setId: string, patch: SetPatch) => void;
  onRemove: (setId: string) => void;
  onToggleWarmup: (setId: string, warmup: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const { unit } = useUnit();
  const [weight, setWeight] = useState(() => weightInputValue(set.weight, unit));
  const [reps, setReps] = useState(set.reps ? String(set.reps) : '');
  const [note, setNote] = useState(set.note ?? '');
  const [showDetail, setShowDetail] = useState(false);
  const [showPlates, setShowPlates] = useState(false);

  // Sincroniza los inputs con el server: al cambiar de unidad, y cuando el valor
  // guardado cambia (eco de un guardado ok o rollback tras un error).
  useEffect(() => {
    setWeight(weightInputValue(set.weight, unit));
    setReps(set.reps ? String(set.reps) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, set.weight, set.reps]);

  useEffect(() => {
    setNote(set.note ?? '');
  }, [set.note]);

  const isWarmup = set.type === 'WARMUP';
  const weightStep = unit === 'LB' ? 5 : 2.5;

  // El input está en la unidad de display; guardamos siempre en kg.
  const persist = () =>
    onSave(set.id, {
      weight: displayToKg(parseFloatSafe(weight), unit),
      reps: parseIntSafe(reps),
    });

  const toggleComplete = () =>
    onSave(set.id, {
      completed: !set.completed,
      weight: displayToKg(parseFloatSafe(weight), unit),
      reps: parseIntSafe(reps),
    });

  const stepWeight = (delta: number) => {
    const next = Math.max(0, roundDisplay(parseFloatSafe(weight) + delta));
    setWeight(next === 0 ? '' : String(next));
    onSave(set.id, { weight: displayToKg(next, unit), reps: parseIntSafe(reps) });
  };

  const stepReps = (delta: number) => {
    const next = Math.max(0, parseIntSafe(reps) + delta);
    setReps(next === 0 ? '' : String(next));
    onSave(set.id, {
      weight: displayToKg(parseFloatSafe(weight), unit),
      reps: next,
    });
  };

  // Tap en "Anterior": prellena peso/reps con los de la sesión previa.
  const fillFromPrevious = () => {
    if (!previous) return;
    setWeight(weightInputValue(previous.weight, unit));
    setReps(previous.reps ? String(previous.reps) : '');
    onSave(set.id, { weight: previous.weight, reps: previous.reps });
  };

  const setRpe = (v: number) =>
    onSave(set.id, { rpe: set.rpe === v ? null : v });

  const prevText = previous
    ? `${roundDisplay(kgToDisplay(previous.weight, unit))}×${previous.reps}`
    : '—';

  const hasDetail = set.rpe != null || (set.note?.trim().length ?? 0) > 0;

  return (
    <div className={cn('rounded-xl transition-colors', set.completed && 'row-done')}>
      <div className="grid grid-cols-[2rem_1fr_4.75rem_3.75rem_2.5rem] items-center gap-2 px-2 py-1.5">
        <Menu
          align="left"
          label="Opciones de la serie"
          trigger={
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold',
                isWarmup
                  ? 'bg-accentLime/15 text-accentLime'
                  : 'bg-surfaceRaised text-textMuted',
              )}
            >
              {isWarmup ? 'W' : index + 1}
            </span>
          }
        >
          <MenuItem onClick={() => setShowDetail((s) => !s)}>
            <StickyNote className="h-4 w-4" />
            Nota / RPE
          </MenuItem>
          <MenuItem onClick={() => setShowPlates(true)}>
            <Calculator className="h-4 w-4" />
            Calculadora de discos
          </MenuItem>
          <MenuItem onClick={() => onToggleWarmup(set.id, !isWarmup)}>
            <Flame className="h-4 w-4" />
            {isWarmup ? 'Volver a normal' : 'Convertir en warmup'}
          </MenuItem>
          {onMoveUp && (
            <MenuItem onClick={onMoveUp}>
              <ArrowUp className="h-4 w-4" />
              Subir
            </MenuItem>
          )}
          {onMoveDown && (
            <MenuItem onClick={onMoveDown}>
              <ArrowDown className="h-4 w-4" />
              Bajar
            </MenuItem>
          )}
          <MenuItem danger onClick={() => onRemove(set.id)}>
            <Trash2 className="h-4 w-4" />
            Eliminar serie
          </MenuItem>
        </Menu>

        {previous ? (
          <button
            type="button"
            onClick={fillFromPrevious}
            aria-label="Usar los valores anteriores"
            className="truncate text-left text-xs text-textMuted transition hover:text-text"
          >
            {prevText}
          </button>
        ) : (
          <span className="truncate text-xs text-textMuted">{prevText}</span>
        )}

        <Spinner
          value={weight}
          placeholder={
            previous ? String(roundDisplay(kgToDisplay(previous.weight, unit))) : '0'
          }
          inputMode="decimal"
          ariaLabel={`Peso serie ${index + 1}`}
          onChange={setWeight}
          onBlur={persist}
          onStep={(dir) => stepWeight(dir * weightStep)}
        />

        <Spinner
          value={reps}
          placeholder={previous ? String(previous.reps) : '0'}
          inputMode="numeric"
          ariaLabel={`Reps serie ${index + 1}`}
          onChange={setReps}
          onBlur={persist}
          onStep={(dir) => stepReps(dir)}
        />

        <button
          type="button"
          onClick={toggleComplete}
          aria-label={set.completed ? 'Desmarcar serie' : 'Completar serie'}
          aria-pressed={set.completed}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition',
            set.completed
              ? 'bg-primary text-ink'
              : 'bg-surfaceRaised text-textMuted hover:text-text',
          )}
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

      {/* Insignia de récord en vivo */}
      {isPr && (
        <div className="px-2 pb-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-accentLime/15 px-2 py-0.5 text-[11px] font-bold text-accentLime">
            <Trophy className="h-3 w-3" />
            ¡Récord!
          </span>
        </div>
      )}

      {/* Resumen colapsado de nota/RPE (tap para editar) */}
      {!showDetail && hasDetail && (
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="flex w-full items-center gap-2 px-3 pb-1.5 text-left text-xs text-textMuted"
        >
          {set.rpe != null && (
            <span className="font-semibold text-accentLime">RPE {set.rpe}</span>
          )}
          {set.note?.trim() && <span className="truncate">{set.note}</span>}
        </button>
      )}

      {/* Editor de nota/RPE */}
      {showDetail && (
        <div className="space-y-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-textMuted">
              RPE
            </span>
            {RPE_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRpe(v)}
                aria-pressed={set.rpe === v}
                className={cn(
                  'h-7 w-7 rounded-lg text-xs font-semibold transition',
                  set.rpe === v
                    ? 'bg-accentLime text-ink'
                    : 'bg-surfaceRaised text-textMuted hover:text-text',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onSave(set.id, { note: note.trim() || null })}
            placeholder="Nota de la serie…"
            maxLength={280}
            className="h-9 w-full rounded-lg bg-surfaceRaised px-3 text-sm text-text outline-none placeholder:text-textMuted/50 focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {showPlates && (
        <PlateCalculator
          weightKg={displayToKg(parseFloatSafe(weight), unit)}
          onClose={() => setShowPlates(false)}
        />
      )}
    </div>
  );
}

/** Input numérico con spinner (chevrons) a la derecha para sumar/restar. */
function Spinner({
  value,
  placeholder,
  inputMode,
  ariaLabel,
  onChange,
  onBlur,
  onStep,
}: {
  value: string;
  placeholder: string;
  inputMode: 'decimal' | 'numeric';
  ariaLabel: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  return (
    <div className="relative">
      <input
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-label={ariaLabel}
        className="h-9 w-full rounded-lg bg-surfaceRaised pl-1.5 pr-5 text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="absolute inset-y-0 right-0 flex w-5 flex-col border-l border-white/5">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Sumar"
          onClick={() => onStep(1)}
          className="flex h-1/2 items-center justify-center text-textMuted transition active:text-primary"
        >
          <ChevronUp className="h-3 w-3" strokeWidth={3} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Restar"
          onClick={() => onStep(-1)}
          className="flex h-1/2 items-center justify-center text-textMuted transition active:text-primary"
        >
          <ChevronDown className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
