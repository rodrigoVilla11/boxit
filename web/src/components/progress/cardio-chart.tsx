'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatDuration, formatSessionDate } from '@/lib/format';
import { activityLabel, formatDistance, formatPace } from '@/lib/activity';
import { getActivities, type Activity } from '@/lib/activities';
import type { ActivityType } from '@/lib/activities';

const W = 340;
const H = 150;
const PAD_X = 8;
const TOP = 14;
const BASE = 128;

function barPath(x: number, top: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${top + h} L${x},${top + rr} Q${x},${top} ${x + rr},${top} L${
    x + w - rr
  },${top} Q${x + w},${top} ${x + w},${top + rr} L${x + w},${top + h} Z`;
}

export function CardioChart() {
  const [acts, setActs] = useState<Activity[] | null>(null);
  const [type, setType] = useState<ActivityType | null>(null);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    getActivities()
      .then(setActs)
      .catch(() => setActs([]));
  }, []);

  // tipos que el usuario hizo, por frecuencia desc
  const types = useMemo(() => {
    const counts = new Map<ActivityType, number>();
    for (const a of acts ?? []) counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [acts]);

  const active = type ?? types[0] ?? null;
  // últimas 12 del tipo, cronológico
  const data = useMemo(
    () =>
      (acts ?? [])
        .filter((a) => a.type === active)
        .slice()
        .sort((a, b) => +new Date(a.performedAt) - +new Date(b.performedAt))
        .slice(-12),
    [acts, active],
  );

  if (acts === null) return null;
  if (types.length === 0) return null;

  const usesDistance = data.some((a) => a.distanceM > 0);
  const metric = (a: Activity) => (usesDistance ? a.distanceM : a.durationSec);
  const maxV = Math.max(0, ...data.map(metric));
  const slot = (W - PAD_X * 2) / Math.max(1, data.length);
  const barW = Math.min(30, slot * 0.62);
  const idx = sel !== null && sel >= 0 && sel < data.length ? sel : data.length - 1;
  const cur = data[idx];

  const readout = cur
    ? usesDistance
      ? formatPace(cur.distanceM, cur.durationSec, cur.type) ??
        formatDistance(cur.distanceM, cur.type)
      : formatDuration(cur.durationSec)
    : '';
  const readoutMain = cur
    ? usesDistance
      ? formatDistance(cur.distanceM, cur.type) || formatDuration(cur.durationSec)
      : formatDuration(cur.durationSec)
    : '';

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-text">Cardio</h2>
        <div className="text-right">
          <span className="font-display text-sm font-semibold text-primary">
            {readoutMain}
          </span>
          {cur && (
            <span className="ml-2 text-xs text-textMuted">
              {readout && readout !== readoutMain ? `${readout} · ` : ''}
              {formatSessionDate(cur.performedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setSel(null);
            }}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
              t === active
                ? 'bg-primary text-ink'
                : 'bg-surfaceRaised text-textMuted hover:text-text',
            )}
          >
            {activityLabel(t)}
          </button>
        ))}
      </div>

      {maxV === 0 ? (
        <p className="py-6 text-center text-sm text-textMuted">
          Sin datos de {active ? activityLabel(active) : 'cardio'} para graficar.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-1 w-full"
          role="img"
          aria-label={`${usesDistance ? 'Distancia' : 'Duración'} de ${active ? activityLabel(active) : ''}`}
        >
          <line
            x1={PAD_X}
            y1={BASE}
            x2={W - PAD_X}
            y2={BASE}
            stroke="#8A938F"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
          {data.map((a, i) => {
            const h = maxV > 0 ? (metric(a) / maxV) * (BASE - TOP) : 0;
            const x = PAD_X + slot * i + (slot - barW) / 2;
            const isSel = i === idx;
            return (
              <g key={a.id} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
                <rect x={PAD_X + slot * i} y={TOP} width={slot} height={BASE - TOP} fill="transparent" />
                {h > 0 && (
                  <path
                    d={barPath(x, BASE - h, barW, h, 4)}
                    fill={isSel ? '#A3E635' : '#22C55E'}
                    fillOpacity={isSel ? 1 : 0.55}
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
