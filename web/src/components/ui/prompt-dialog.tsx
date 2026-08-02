'use client';

import { useEffect, useState } from 'react';
import { Button } from './button';
import { TextField } from './text-field';
import { useLockBody } from '@/hooks/use-lock-body';

/** Diálogo con un campo de texto (crear/renombrar). Bottom-sheet. */
export function PromptDialog({
  open,
  title,
  label,
  placeholder,
  initial = '',
  confirmLabel = 'Guardar',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);
  useLockBody(open);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  if (!open) return null;

  async function confirm() {
    const v = value.trim();
    if (!v) return;
    setPending(true);
    try {
      await onConfirm(v);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[75] flex items-end justify-center bg-black/60 px-4 pb-safe backdrop-blur-sm"
      onClick={() => !pending && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="app-shell animate-sheet-in mb-4 w-full rounded-3xl border border-white/10 bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-display text-lg font-semibold text-text">{title}</h2>
        <TextField
          label={label}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          placeholder={placeholder}
          maxLength={60}
          autoFocus
        />
        <div className="mt-4 flex gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={confirm} loading={pending} disabled={!value.trim()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
