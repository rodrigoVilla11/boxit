'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function Button({
  loading = false,
  variant = 'primary',
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        variant === 'primary' && 'bg-primary text-ink hover:bg-primary-deep',
        variant === 'ghost' && 'bg-surfaceRaised text-text hover:bg-white/5',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}
