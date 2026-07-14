'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ label, className, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="block">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-textMuted"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'h-12 w-full rounded-2xl bg-surfaceRaised px-4 text-base text-text outline-none ring-1 ring-white/5',
          'placeholder:text-textMuted/50 focus:ring-2 focus:ring-primary',
          className,
        )}
        {...rest}
      />
    </div>
  );
}
