'use client';

import { useState } from 'react';
import { useUnit } from '@/components/unit-provider';
import { formatVolume } from '@/lib/units';
import { formatSessionDate } from '@/lib/format';

export type VolumePoint = { id: string; date: string | null; volume: number };

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

export function VolumeChart({ points }: { points: VolumePoint[] }) {
  const { unit } = useUnit();
  const data = points.slice(-12); // últimas 12 sesiones, cronológico
  const [sel, setSel] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <h2 className="font-display text-base font-semibold text-text">
          Volumen por sesión
        </h2>
        <p className="py-6 text-center text-sm text-textMuted">
          Sin entrenos todavía.
        </p>
      </section>
    );
  }

  const maxV = Math.max(...data.map((d) => d.volume), 1);
  const slot = (W - PAD_X * 2) / data.length;
  const barW = Math.min(30, slot * 0.62);
  const idx = sel !== null && sel >= 0 && sel < data.length ? sel : data.length - 1;
  const selected = data[idx];

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-text">
          Volumen por sesión
        </h2>
        <div className="text-right">
          <span className="font-display text-sm font-semibold text-primary">
            {formatVolume(selected.volume, unit)}
          </span>
          <span className="ml-2 text-xs text-textMuted">
            {formatSessionDate(selected.date)}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full"
        role="img"
        aria-label="Volumen por sesión"
      >
        {/* baseline recesiva */}
        <line x1={PAD_X} y1={BASE} x2={W - PAD_X} y2={BASE} stroke="#8A938F" strokeOpacity={0.25} strokeWidth={1} />
        {data.map((d, i) => {
          const h = (d.volume / maxV) * (BASE - TOP);
          const x = PAD_X + slot * i + (slot - barW) / 2;
          const isSel = i === idx;
          return (
            <g key={d.id} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
              {/* área de toque */}
              <rect x={PAD_X + slot * i} y={TOP} width={slot} height={BASE - TOP} fill="transparent" />
              <path
                d={barPath(x, BASE - h, barW, h, 4)}
                fill={isSel ? '#A3E635' : '#22C55E'}
                fillOpacity={isSel ? 1 : 0.55}
              />
            </g>
          );
        })}
      </svg>
    </section>
  );
}
