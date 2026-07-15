'use client';

import { MUSCLE_BASE } from '@/lib/muscle-color';
import type { MuscleKey } from '@/lib/progress';

type FillFn = (muscle: MuscleKey) => string;

const STROKE = '#0B0F0E'; // separación entre regiones (color ink)

function Region({ fill, children }: { fill: string; children: React.ReactNode }) {
  return <g fill={fill} stroke={STROKE} strokeWidth={1.5}>{children}</g>;
}

/** Cuerpo estilizado (frente o espalda) con músculos pintados por intensidad. */
export function BodyDiagram({
  view,
  colorFor,
  label,
}: {
  view: 'front' | 'back';
  colorFor: FillFn;
  label: string;
}) {
  const base = MUSCLE_BASE;

  // Partes centrales (no se espejan)
  const center = (
    <>
      <Region fill={base}>
        <ellipse cx={60} cy={20} rx={11} ry={13} />
        <rect x={54.5} y={30} width={11} height={9} rx={3} />
        <rect x={42} y={42} width={36} height={68} rx={13} />
        <rect x={44} y={104} width={32} height={18} rx={8} />
      </Region>
      {view === 'front' ? (
        <Region fill={colorFor('CORE')}>
          <rect x={51} y={70} width={18} height={38} rx={6} />
        </Region>
      ) : (
        <Region fill={colorFor('BACK')}>
          <rect x={44} y={44} width={32} height={50} rx={10} />
        </Region>
      )}
    </>
  );

  // Partes de un lado (se dibujan y se espejan a la derecha)
  const side =
    view === 'front' ? (
      <>
        <Region fill={colorFor('SHOULDERS')}>
          <ellipse cx={40} cy={47} rx={12} ry={9} />
        </Region>
        <Region fill={colorFor('CHEST')}>
          <rect x={46} y={46} width={12} height={20} rx={6} />
        </Region>
        <Region fill={colorFor('BICEPS')}>
          <rect x={27} y={55} width={13} height={37} rx={6.5} />
        </Region>
        <Region fill={colorFor('FOREARMS')}>
          <rect x={25} y={93} width={12} height={36} rx={6} />
        </Region>
        <Region fill={base}>
          <ellipse cx={31} cy={133} rx={6.5} ry={7.5} />
        </Region>
        <Region fill={colorFor('QUADS')}>
          <rect x={44} y={115} width={15} height={56} rx={7.5} />
        </Region>
        <Region fill={base}>
          <rect x={46} y={174} width={12.5} height={50} rx={6} />
          <ellipse cx={52.5} cy={228} rx={8} ry={6} />
        </Region>
      </>
    ) : (
      <>
        <Region fill={colorFor('SHOULDERS')}>
          <ellipse cx={40} cy={47} rx={12} ry={9} />
        </Region>
        <Region fill={colorFor('TRICEPS')}>
          <rect x={27} y={55} width={13} height={37} rx={6.5} />
        </Region>
        <Region fill={colorFor('FOREARMS')}>
          <rect x={25} y={93} width={12} height={36} rx={6} />
        </Region>
        <Region fill={base}>
          <ellipse cx={31} cy={133} rx={6.5} ry={7.5} />
        </Region>
        <Region fill={colorFor('GLUTES')}>
          <ellipse cx={51} cy={113} rx={11} ry={10} />
        </Region>
        <Region fill={colorFor('HAMSTRINGS')}>
          <rect x={44} y={120} width={15} height={52} rx={7.5} />
        </Region>
        <Region fill={colorFor('CALVES')}>
          <rect x={46} y={176} width={12.5} height={48} rx={6} />
        </Region>
        <Region fill={base}>
          <ellipse cx={52.5} cy={228} rx={8} ry={6} />
        </Region>
      </>
    );

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 120 250"
        className="h-auto w-full max-w-[150px]"
        role="img"
        aria-label={`Músculos — ${label}`}
      >
        {center}
        {side}
        <g transform="matrix(-1 0 0 1 120 0)">{side}</g>
      </svg>
      <span className="text-xs font-medium text-textMuted">{label}</span>
    </div>
  );
}
