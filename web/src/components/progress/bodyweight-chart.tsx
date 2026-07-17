'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useUnit } from '@/components/unit-provider';
import { useToast } from '@/components/toast-provider';
import { displayToKg, kgToDisplay, roundDisplay, unitLabel } from '@/lib/units';
import { formatSessionDate } from '@/lib/format';
import {
  createBodyweight,
  deleteBodyweight,
  getBodyweights,
  type Bodyweight,
} from '@/lib/bodyweight';

const W = 340;
const H = 150;
const PADX = 12;
const TOP = 14;
const BASE = 128;

export function BodyweightChart() {
  const { unit } = useUnit();
  const toast = useToast();
  const [rows, setRows] = useState<Bodyweight[] | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [sel, setSel] = useState<number>(-1);

  useEffect(() => {
    getBodyweights()
      .then((r) => {
        setRows(r);
        setSel(r.length - 1); // el más reciente (los ordenamos asc abajo)
      })
      .catch(() => setRows([]));
  }, []);

  // asc (viejo → nuevo) para el gráfico
  const asc = useMemo(() => (rows ? [...rows].reverse() : []), [rows]);

  const geo = useMemo(() => {
    const ys = asc.map((r) => roundDisplay(kgToDisplay(r.weightKg, unit)));
    const rawMin = Math.min(...ys);
    const rawMax = Math.max(...ys);
    const span = rawMax - rawMin;
    const yMin = span === 0 ? Math.max(0, rawMin - 1) : rawMin - span * 0.2;
    const yMax = span === 0 ? rawMax + 1 : rawMax + span * 0.2;
    const range = yMax - yMin || 1;
    const x = (i: number) =>
      asc.length <= 1 ? W / 2 : PADX + (i / (asc.length - 1)) * (W - PADX * 2);
    const y = (v: number) => BASE - ((v - yMin) / range) * (BASE - TOP);
    return { x, y };
  }, [asc, unit]);

  const line = asc
    .map(
      (r, i) =>
        `${i === 0 ? 'M' : 'L'}${geo.x(i)},${geo.y(
          roundDisplay(kgToDisplay(r.weightKg, unit)),
        )}`,
    )
    .join(' ');

  const idx = sel >= 0 && sel < asc.length ? sel : asc.length - 1;
  const selected = asc[idx];
  const latest = asc[asc.length - 1];
  const first = asc[0];
  const delta =
    latest && first ? roundDisplay(kgToDisplay(latest.weightKg - first.weightKg, unit)) : 0;

  async function add() {
    if (saving) return;
    const v = parseFloat(input.replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) {
      toast.error('Ingresá un peso válido.');
      return;
    }
    setSaving(true);
    try {
      const created = await createBodyweight({ weightKg: displayToKg(v, unit) });
      setRows((prev) => [created, ...(prev ?? [])]);
      setSel((prev) => (prev < 0 ? 0 : prev + 1)); // sigue apuntando al más nuevo
      setInput('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos guardar tu peso.');
    } finally {
      setSaving(false);
    }
  }

  async function removeSelected() {
    if (!selected) return;
    const id = selected.id;
    setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    setSel((prev) => Math.max(-1, prev - 1));
    try {
      await deleteBodyweight(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar el registro.');
      getBodyweights().then(setRows).catch(() => {});
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-text">Peso corporal</h2>
        {latest && (
          <span className="inline-flex items-center gap-1 text-sm">
            <span className="font-display font-semibold text-primary">
              {roundDisplay(kgToDisplay(latest.weightKg, unit))} {unitLabel(unit)}
            </span>
            {delta !== 0 && (
              <span
                className={`inline-flex items-center text-xs ${
                  delta < 0 ? 'text-primary' : 'text-textMuted'
                }`}
              >
                {delta < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
                {Math.abs(delta)}
              </span>
            )}
          </span>
        )}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-10 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          {asc.length > 0 ? (
            <>
              <div className="mt-1 flex items-center justify-between text-xs text-textMuted">
                <span>{selected ? formatSessionDate(selected.takenAt) : ''}</span>
                {selected && (
                  <button
                    type="button"
                    onClick={removeSelected}
                    className="-mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-danger transition active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Borrar
                  </button>
                )}
              </div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-1 w-full"
                role="img"
                aria-label="Peso corporal en el tiempo"
              >
                <line
                  x1={PADX}
                  y1={BASE}
                  x2={W - PADX}
                  y2={BASE}
                  stroke="#8A938F"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                />
                {asc.length > 1 && (
                  <path
                    d={line}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {asc.map((r, i) => {
                  const isSel = i === idx;
                  const cy = geo.y(roundDisplay(kgToDisplay(r.weightKg, unit)));
                  return (
                    <g
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${roundDisplay(kgToDisplay(r.weightKg, unit))} ${unitLabel(unit)}, ${formatSessionDate(r.takenAt)}`}
                      onClick={() => setSel(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSel(i);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx={geo.x(i)} cy={cy} r={13} fill="transparent" />
                      <circle
                        cx={geo.x(i)}
                        cy={cy}
                        r={isSel ? 5 : 3.5}
                        fill={isSel ? '#A3E635' : '#22C55E'}
                        stroke="#151A19"
                        strokeWidth={isSel ? 2 : 0}
                      />
                    </g>
                  );
                })}
              </svg>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-textMuted">
              Registrá tu peso para ver la evolución.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <input
              inputMode="decimal"
              enterKeyHint="done"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !saving && add()}
              placeholder={`Tu peso en ${unitLabel(unit)}`}
              aria-label={`Tu peso en ${unitLabel(unit)}`}
              className="h-11 flex-1 rounded-xl bg-surfaceRaised px-3 text-center text-sm text-text outline-none placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={add}
              disabled={saving || !input.trim()}
              className="flex h-11 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-ink transition hover:bg-primary-deep active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Guardar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
