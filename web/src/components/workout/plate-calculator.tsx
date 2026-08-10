'use client';

import { useEffect, useMemo, useState } from 'react';
import { Info, Minus, Plus, X } from 'lucide-react';
import { useUnit } from '@/components/unit-provider';
import { useLockBody } from '@/hooks/use-lock-body';
import { cn } from '@/lib/cn';
import {
  kgToDisplay,
  roundDisplay,
  unitLabel,
  type WeightUnit,
} from '@/lib/units';
import {
  barOptions,
  defaultBar,
  defaultPlates,
  dumbbellPlans,
  modeForEquipment,
  nearestExactTotals,
  plateCombos,
  readBarPref,
  saveBarPref,
  type BarOption,
  type LoadMode,
  type PlateCombo,
} from '@/lib/plates';

/** Número de peso localizado (coma decimal), sin unidad. */
const num = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });

/** Agrupa los discos de un lado en pares [peso, cantidad], de mayor a menor. */
function groupPlates(perSide: number[]): [number, number][] {
  const m = new Map<number, number>();
  for (const p of perSide) m.set(p, (m.get(p) ?? 0) + 1);
  return [...m.entries()];
}

export function PlateCalculator({
  weightKg,
  equipment,
  onClose,
}: {
  weightKg: number;
  /** Solo define el modo inicial (barra o mancuernas); se puede cambiar. */
  equipment?: string | null;
  onClose: () => void;
}) {
  const { unit } = useUnit();
  useLockBody(true);
  const u = unitLabel(unit);
  const step = unit === 'LB' ? 5 : 2.5;
  const plates = defaultPlates(unit);
  const bars = barOptions(unit);

  // Sin peso cargado todavía arrancamos en el peso de la barra, para no abrir
  // el simulador en 0.
  const [target, setTarget] = useState<number>(
    () => roundDisplay(kgToDisplay(weightKg, unit)) || defaultBar(unit),
  );
  const [mode, setMode] = useState<LoadMode>(() => modeForEquipment(equipment));
  // Para mancuernas: si el número cargado es el total o el de cada mancuerna.
  const [perDumbbell, setPerDumbbell] = useState(false);
  const [barId, setBarId] = useState<string>(
    () => bars.find((b) => b.id === readBarPref())?.id ?? bars[0].id,
  );

  const bar: BarOption = bars.find((b) => b.id === barId) ?? bars[0];
  const pickBar = (b: BarOption) => {
    setBarId(b.id);
    saveBarPref(b.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cómo armar el peso"
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            Cómo armar el peso
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-8 pt-6">
        {/* Peso a simular */}
        <div>
          <label className="mb-2 block text-sm font-medium text-textMuted">
            {mode === 'DUMBBELL' && perDumbbell ? 'Peso por mancuerna' : 'Peso total'}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Restar"
              onClick={() => setTarget((t) => Math.max(0, roundDisplay(t - step)))}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-text active:scale-95"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-baseline justify-center gap-1 rounded-2xl bg-surfaceRaised py-2">
              <span className="font-display text-3xl font-bold tabular-nums text-text">
                {num(roundDisplay(target))}
              </span>
              <span className="text-sm text-textMuted">{u}</span>
            </div>
            <button
              type="button"
              aria-label="Sumar"
              onClick={() => setTarget((t) => roundDisplay(t + step))}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-text active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modo de armado */}
        <div className="flex gap-1 rounded-2xl bg-surface p-1">
          {(
            [
              ['BARBELL', 'Barra y discos'],
              ['DUMBBELL', 'Mancuernas'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
                mode === m ? 'bg-primary text-ink' : 'text-textMuted hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'BARBELL' ? (
          <BarbellView
            target={target}
            bar={bar}
            bars={bars}
            onPickBar={pickBar}
            plates={plates}
            unitSuffix={u}
            onUseTotal={(t) => setTarget(roundDisplay(t))}
          />
        ) : (
          <DumbbellView
            target={target}
            perDumbbell={perDumbbell}
            onPerDumbbell={setPerDumbbell}
            unit={unit}
            unitSuffix={u}
          />
        )}

        <p className="flex items-start gap-2 text-xs text-textMuted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Es solo una guía para chequear cómo cargar el peso. Ni la barra ni el modo
          quedan guardados en el ejercicio.
        </p>
      </div>
    </div>
  );
}

/** Barra + discos: elección de barra y todas las formas de armar el peso. */
function BarbellView({
  target,
  bar,
  bars,
  onPickBar,
  plates,
  unitSuffix: u,
  onUseTotal,
}: {
  target: number;
  bar: BarOption;
  bars: BarOption[];
  onPickBar: (b: BarOption) => void;
  plates: number[];
  unitSuffix: string;
  onUseTotal: (total: number) => void;
}) {
  const perSideTarget = (target - bar.weight) / 2;
  const onlyBar = Math.abs(perSideTarget) < 1e-6;
  const tooLight = perSideTarget < -1e-6;

  const combos = useMemo(
    () => (perSideTarget > 0 ? plateCombos(perSideTarget, plates) : []),
    [perSideTarget, plates],
  );
  // Si no hay combinación exacta, buscamos los totales armables más cercanos.
  const nearest = useMemo(
    () =>
      combos.length === 0 && !onlyBar && !tooLight
        ? nearestExactTotals(target, bar.weight, plates)
        : { below: null, above: null },
    [combos.length, onlyBar, tooLight, target, bar.weight, plates],
  );

  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [target, bar.id, plates]);
  const combo: PlateCombo | undefined = combos[selected] ?? combos[0];

  return (
    <>
      {/* Tipo de barra */}
      <div>
        <label className="mb-2 block text-sm font-medium text-textMuted">
          Tipo de barra
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {bars.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onPickBar(b)}
              aria-pressed={bar.id === b.id}
              className={cn(
                'rounded-xl px-2 py-2 text-center transition',
                bar.id === b.id
                  ? 'bg-primary text-ink'
                  : 'bg-surface text-textMuted hover:text-text',
              )}
            >
              <span className="block text-xs font-semibold leading-tight">
                {b.label}
              </span>
              <span
                className={cn(
                  'block text-[11px] tabular-nums',
                  bar.id === b.id ? 'text-ink/70' : 'text-textMuted',
                )}
              >
                {b.weight > 0 ? `${num(b.weight)} ${u}` : '—'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual de la barra con los discos de un lado */}
      <div>
        <p className="mb-2 text-center text-xs uppercase tracking-wider text-textMuted">
          Cada lado
        </p>
        <div className="flex h-40 items-center justify-center gap-[3px] rounded-2xl bg-surface px-4">
          <div className="h-2 w-8 rounded-l bg-textMuted/40" />
          {!combo ? (
            <span className="px-3 text-sm text-textMuted">
              {onlyBar ? 'Solo la barra' : '—'}
            </span>
          ) : (
            combo.perSide.map((p, i) => {
              const h = 40 + Math.round((p / Math.max(...plates)) * 100); // 40–140px
              return (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className="flex w-7 items-center justify-center rounded bg-primary/80 text-[10px] font-bold text-ink"
                >
                  {num(p)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Formas de armarlo */}
      {tooLight ? (
        <p className="rounded-2xl bg-surface p-4 text-sm text-textMuted">
          {num(target)} {u} es menos que la barra ({num(bar.weight)} {u}). Elegí una
          barra más liviana o subí el peso.
        </p>
      ) : onlyBar ? (
        <p className="rounded-2xl bg-surface p-4 text-sm text-text">
          Solo la barra, sin discos.
        </p>
      ) : combos.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-textMuted">
            Opciones (discos por lado)
          </p>
          <div className="space-y-1.5">
            {combos.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={combo === c}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition',
                  combo === c
                    ? 'bg-primary/15 ring-1 ring-primary'
                    : 'bg-surface hover:bg-surfaceRaised',
                )}
              >
                <span className="flex flex-1 flex-wrap gap-1.5">
                  {groupPlates(c.perSide).map(([p, n]) => (
                    <span
                      key={p}
                      className="rounded-full bg-surfaceRaised px-2.5 py-0.5 text-sm font-semibold tabular-nums text-text"
                    >
                      {n} × {num(p)} {u}
                    </span>
                  ))}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-textMuted">
                  {c.count * 2} discos
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm text-text">
            No se puede armar {num(target)} {u} exacto con la barra {bar.label} y los
            discos estándar.
          </p>
          {(nearest.below !== null || nearest.above !== null) && (
            <>
              <p className="mt-3 text-xs text-textMuted">Lo más cerca:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[nearest.below, nearest.above]
                  .filter((t): t is number => t !== null)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUseTotal(t)}
                      className="rounded-full bg-surfaceRaised px-3 py-1 text-sm font-semibold tabular-nums text-text transition hover:text-primary"
                    >
                      {num(roundDisplay(t))} {u}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** Mancuernas: dos iguales o una sola para llegar al peso. */
function DumbbellView({
  target,
  perDumbbell,
  onPerDumbbell,
  unit,
  unitSuffix: u,
}: {
  target: number;
  perDumbbell: boolean;
  onPerDumbbell: (v: boolean) => void;
  unit: WeightUnit;
  unitSuffix: string;
}) {
  // Si el número cargado es por mancuerna, el total es el doble.
  const total = perDumbbell ? roundDisplay(target * 2) : target;
  const plans = useMemo(() => dumbbellPlans(total, unit), [total, unit]);

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-textMuted">
          El peso que cargaste es…
        </label>
        <div className="flex gap-1 rounded-2xl bg-surface p-1">
          {(
            [
              [false, 'Total'],
              [true, 'Por mancuerna'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => onPerDumbbell(v)}
              aria-pressed={perDumbbell === v}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
                perDumbbell === v
                  ? 'bg-primary text-ink'
                  : 'text-textMuted hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {perDumbbell && (
          <p className="mt-2 text-xs text-textMuted">
            {num(target)} {u} en cada mano = {num(total)} {u} en total.
          </p>
        )}
      </div>

      {plans.length === 0 ? (
        <p className="rounded-2xl bg-surface p-4 text-sm text-textMuted">
          Cargá un peso mayor a 0 para ver las opciones.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-sm font-medium text-textMuted">
            Opciones para {num(roundDisplay(total))} {u}
          </p>
          <div className="space-y-1.5">
            {plans.map((p) => (
              <div
                key={`${p.count}-${p.each}`}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl px-3 py-3',
                  p.exact ? 'bg-primary/15 ring-1 ring-primary' : 'bg-surface',
                )}
              >
                <span className="text-base font-semibold tabular-nums text-text">
                  {p.count} × {num(p.each)} {u}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-textMuted">
                  {p.exact ? (
                    <>
                      {num(p.total)} {u} ·{' '}
                      {p.count === 2 ? 'una en cada mano' : 'unilateral'}
                    </>
                  ) : (
                    <>
                      {num(p.total)} {u} · {p.total > total ? '+' : '−'}
                      {num(roundDisplay(Math.abs(p.total - total)))} {u}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
