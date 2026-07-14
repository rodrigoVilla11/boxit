'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export function Menu({
  trigger,
  children,
  align = 'right',
  label,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            'absolute z-30 mt-1 min-w-[190px] overflow-hidden rounded-xl border border-white/10 bg-surfaceRaised p-1 shadow-card',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  danger = false,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-white/5',
        danger ? 'text-danger' : 'text-text',
      )}
    >
      {children}
    </button>
  );
}
