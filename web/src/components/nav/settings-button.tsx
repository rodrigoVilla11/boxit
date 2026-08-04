'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Acceso a Ajustes. Va en el header de todas las pantallas principales. */
export function SettingsButton({ className }: { className?: string }) {
  return (
    <Link
      href="/ajustes"
      aria-label="Ajustes"
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text active:scale-95',
        className,
      )}
    >
      <Settings className="h-5 w-5" />
    </Link>
  );
}
