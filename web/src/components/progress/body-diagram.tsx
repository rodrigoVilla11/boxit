'use client';

import type { MuscleKey } from '@/lib/progress';

type FillFn = (muscle: MuscleKey) => string;

const BASE_FILL = '#2b322f'; // cuerpo (partes no musculares / no entrenadas)
const BASE_STROKE = '#6b736e'; // contorno del cuerpo
const INK = '#0B0F0E'; // separación entre músculos

// Silueta y brazos (medio cuerpo; se espeja) — comunes a frente y espalda
const SILHOUETTE =
  'M100,64 C112,64 122,68 134,78 C151,86 163,98 162,118 C160,128 150,130 142,127 C137,150 131,168 126,182 C130,196 133,206 133,216 C137,256 135,292 127,322 C131,348 129,380 120,406 L116,417 C124,421 124,430 110,428 L104,419 C102,400 102,380 102,360 L102,330 C102,292 102,255 100,220 L100,216 Z';
const ARM =
  'M141,120 C158,128 165,150 161,176 C158,200 153,224 148,246 L146,258 C152,264 151,275 143,274 C137,273 135,264 135,254 C137,228 141,204 144,180 C146,158 148,138 140,126 Z';
const NECK = 'M88,48 C89,58 88,64 84,70 C95,75 105,75 116,70 C112,64 111,58 112,48 Z';
const MIRROR = 'matrix(-1 0 0 1 200 0)';

function BasePath({ d }: { d: string }) {
  return (
    <path
      d={d}
      fill={BASE_FILL}
      stroke={BASE_STROKE}
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

/** Músculo central (no se espeja). */
function M({ d, fill }: { d: string; fill: string }) {
  return <path d={d} fill={fill} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />;
}

/** Músculo simétrico: se dibuja y se espeja al otro lado. */
function Sym({ d, fill }: { d: string; fill: string }) {
  return (
    <>
      <M d={d} fill={fill} />
      <g transform={MIRROR}>
        <M d={d} fill={fill} />
      </g>
    </>
  );
}

export function BodyDiagram({
  view,
  colorFor,
  label,
}: {
  view: 'front' | 'back';
  colorFor: FillFn;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 200 440"
        className="h-auto w-full max-w-[160px]"
        role="img"
        aria-label={`Músculos — ${label}`}
      >
        {/* base */}
        <ellipse
          cx={100}
          cy={30}
          rx={19}
          ry={23}
          fill={BASE_FILL}
          stroke={BASE_STROKE}
          strokeWidth={1.8}
        />
        <BasePath d={NECK} />
        <BasePath d={SILHOUETTE} />
        <g transform={MIRROR}>
          <BasePath d={SILHOUETTE} />
        </g>
        <BasePath d={ARM} />
        <g transform={MIRROR}>
          <BasePath d={ARM} />
        </g>

        {view === 'front' ? (
          <>
            {/* trapecio superior */}
            <M
              d="M100,62 C90,63 80,70 72,82 C82,79 92,80 100,82 C108,80 118,79 128,82 C120,70 110,63 100,62 Z"
              fill={colorFor('SHOULDERS')}
            />
            {/* deltoides */}
            <Sym d="M132,80 C150,86 160,100 158,118 C150,116 140,108 134,96 Z" fill={colorFor('SHOULDERS')} />
            {/* pectorales */}
            <Sym d="M99,88 C99,108 93,124 78,127 C65,127 58,116 60,104 C62,93 78,87 97,86 Z" fill={colorFor('CHEST')} />
            {/* bíceps */}
            <Sym d="M142,124 C155,132 158,152 153,174 C148,170 142,152 140,132 Z" fill={colorFor('BICEPS')} />
            {/* antebrazos */}
            <Sym d="M150,182 C156,198 153,222 147,244 C142,240 140,216 142,194 Z" fill={colorFor('FOREARMS')} />
            {/* abdominales + segmentación */}
            <M
              d="M89,132 C93,130 107,130 111,132 C113,152 113,180 106,194 C102,200 98,200 94,194 C87,180 87,152 89,132 Z"
              fill={colorFor('CORE')}
            />
            <path d="M100,134 V192 M90,150 H110 M89,166 H111 M90,180 H110" fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
            {/* oblicuos */}
            <Sym d="M114,134 C122,144 124,166 119,186 C115,174 112,154 111,138 Z" fill={colorFor('CORE')} />
            {/* cuádriceps */}
            <Sym d="M104,222 C120,226 129,250 127,284 C126,300 121,314 113,318 C111,316 110,312 109,304 C107,282 105,252 103,230 Z" fill={colorFor('QUADS')} />
          </>
        ) : (
          <>
            {/* trapecio (grande) */}
            <M
              d="M100,62 C120,66 132,84 133,100 C120,96 108,100 100,150 C92,100 80,96 67,100 C68,84 80,66 100,62 Z"
              fill={colorFor('BACK')}
            />
            {/* deltoides posteriores */}
            <Sym d="M132,80 C150,86 160,100 158,118 C150,116 140,108 134,96 Z" fill={colorFor('SHOULDERS')} />
            {/* dorsales */}
            <Sym d="M131,104 C141,128 138,158 110,184 C112,168 108,150 108,120 C114,110 124,106 131,104 Z" fill={colorFor('BACK')} />
            {/* lumbar */}
            <M d="M92,158 C96,156 104,156 108,158 C110,172 108,186 100,192 C92,186 90,172 92,158 Z" fill={colorFor('BACK')} />
            {/* tríceps */}
            <Sym d="M142,124 C155,132 158,152 153,174 C148,170 142,152 140,132 Z" fill={colorFor('TRICEPS')} />
            {/* antebrazos */}
            <Sym d="M150,182 C156,198 153,222 147,244 C142,240 140,216 142,194 Z" fill={colorFor('FOREARMS')} />
            {/* glúteos */}
            <Sym d="M100,200 C116,200 127,210 126,226 C125,240 112,246 100,242 Z" fill={colorFor('GLUTES')} />
            {/* isquiotibiales */}
            <Sym d="M103,246 C119,250 127,272 125,302 C124,318 118,330 110,330 C108,308 106,276 103,254 Z" fill={colorFor('HAMSTRINGS')} />
            {/* gemelos */}
            <Sym d="M105,344 C115,348 118,366 114,390 C111,404 107,408 104,402 C103,382 103,360 105,346 Z" fill={colorFor('CALVES')} />
          </>
        )}
      </svg>
      <span className="text-xs font-medium text-textMuted">{label}</span>
    </div>
  );
}
