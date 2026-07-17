'use client';

import { cn } from '@/lib/cn';

/**
 * Riel + knob visual de un toggle. No es interactivo: el `aria-pressed` y el
 * onClick van en el botón contenedor (así se puede tocar toda la fila).
 */
export function SwitchVisual({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition',
        on ? 'bg-primary' : 'bg-surfaceRaised',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-text transition-all',
          on ? 'left-[1.125rem]' : 'left-0.5',
        )}
      />
    </span>
  );
}
