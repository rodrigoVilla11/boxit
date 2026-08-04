'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Trash2,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Menu, MenuItem } from '@/components/ui/menu';
import { useUnit } from '@/components/unit-provider';
import { PlateCalculator } from './plate-calculator';
import { displayToKg, kgToDisplay, roundDisplay, weightInputValue } from '@/lib/units';
import type { PreviousSet, SetPatch, SetType, WorkoutSet } from '@/lib/workouts';

const RPE_OPTIONS = [6, 7, 8, 9, 10];

// Tipos de serie: badge (letra o número) + color. NORMAL muestra el número de serie.
const SET_TYPES: {
  type: SetType;
  label: string;
  badge: string;
  badgeClass: string;
}[] = [
  { type: 'NORMAL', label: 'Serie normal', badge: '', badgeClass: 'bg-surfaceRaised text-textMuted' },
  { type: 'WARMUP', label: 'Calentamiento', badge: 'W', badgeClass: 'bg-accentLime/15 text-accentLime' },
  { type: 'DROP', label: 'Drop set', badge: 'D', badgeClass: 'bg-amber-400/15 text-amber-400' },
  { type: 'FAILURE', label: 'Al fallo', badge: 'F', badgeClass: 'bg-danger/15 text-danger' },
];

const parseFloatSafe = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const parseIntSafe = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

export function SetRow({
  index,
  set,
  previous,
  target,
  isPr = false,
  onSave,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  set: WorkoutSet;
  previous?: PreviousSet;
  target?: { weight: number | null; reps: number | null };
  isPr?: boolean;
  onSave: (setId: string, patch: SetPatch) => void;
  onRemove: (setId: string) => void;
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

  const typeMeta = SET_TYPES.find((t) => t.type === set.type) ?? SET_TYPES[0];
  const weightStep = unit === 'LB' ? 5 : 2.5;

  // El input está en la unidad de display; guardamos siempre en kg.
  // Comparamos en base kg para no reescribir (ni acumular drift kg/lb) si no cambió.
  const draft = () => ({
    kg: displayToKg(parseFloatSafe(weight), unit),
    reps: parseIntSafe(reps),
  });
  const unchanged = (d: { kg: number; reps: number }) =>
    Math.abs(d.kg - set.weight) < 1e-4 && d.reps === set.reps;

  const persist = () => {
    const d = draft();
    if (unchanged(d)) return;
    onSave(set.id, { weight: d.kg, reps: d.reps });
  };

  const toggleComplete = () => {
    const d = draft();
    onSave(
      set.id,
      unchanged(d)
        ? { completed: !set.completed }
        : { completed: !set.completed, weight: d.kg, reps: d.reps },
    );
  };

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
      <div className="grid grid-cols-[2.25rem_1fr_5rem_4rem_2.75rem] items-center gap-2 px-2 py-1.5">
        <Menu
          align="left"
          label="Opciones de la serie"
          trigger={
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold',
                typeMeta.badgeClass,
              )}
            >
              {set.type === 'NORMAL' ? index + 1 : typeMeta.badge}
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
          {SET_TYPES.map((t) => (
            <MenuItem key={t.type} onClick={() => onSave(set.id, { type: t.type })}>
              <Check
                className={cn('h-4 w-4', t.type === set.type ? 'opacity-100' : 'opacity-0')}
              />
              {t.label}
            </MenuItem>
          ))}
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
            previous
              ? String(roundDisplay(kgToDisplay(previous.weight, unit)))
              : target?.weight
                ? String(roundDisplay(kgToDisplay(target.weight, unit)))
                : '0'
          }
          inputMode="decimal"
          ariaLabel={`Peso serie ${index + 1}`}
          onChange={setWeight}
          onBlur={persist}
          onStep={(dir) => stepWeight(dir * weightStep)}
        />

        <Spinner
          value={reps}
          placeholder={
            previous ? String(previous.reps) : target?.reps ? String(target.reps) : '0'
          }
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
            'flex h-11 w-11 items-center justify-center rounded-lg transition active:scale-95',
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
                aria-label={`RPE ${v}`}
                aria-pressed={set.rpe === v}
                className={cn(
                  'h-8 w-8 rounded-lg text-xs font-semibold transition active:scale-95',
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
            aria-label="Nota de la serie"
            maxLength={280}
            className="h-10 w-full rounded-lg bg-surfaceRaised px-3 text-sm text-text outline-none placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
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
        enterKeyHint="done"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={onBlur}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-lg bg-surfaceRaised pl-1.5 pr-6 text-center text-sm text-text outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="absolute inset-y-0 right-0 flex w-6 flex-col border-l border-white/5">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Sumar"
          onClick={() => onStep(1)}
          className="flex h-1/2 items-center justify-center text-textMuted transition active:scale-90 active:text-primary"
        >
          <ChevronUp className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Restar"
          onClick={() => onStep(-1)}
          className="flex h-1/2 items-center justify-center text-textMuted transition active:scale-90 active:text-primary"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
