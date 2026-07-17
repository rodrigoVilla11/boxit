'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './button';
import { useLockBody } from '@/hooks/use-lock-body';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const titleId = useId();
  const msgId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState(false);

  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
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
        aria-labelledby={titleId}
        aria-describedby={msgId}
        className="app-shell animate-sheet-in mb-4 w-full rounded-3xl border border-white/10 bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-lg font-semibold text-text">
          {title}
        </h2>
        <p id={msgId} className="mt-1.5 text-sm text-textMuted">
          {message}
        </p>
        <div className="mt-5 flex gap-3">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
