'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

/** Campo de contraseña con toggle mostrar/ocultar. */
export function PasswordField({ label, className, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);

  return (
    <div className="block">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-textMuted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          className={cn(
            'h-12 w-full rounded-2xl bg-surfaceRaised pl-4 pr-12 text-base text-text outline-none ring-1 ring-white/5',
            'placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary',
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textMuted transition hover:text-text active:scale-90"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
