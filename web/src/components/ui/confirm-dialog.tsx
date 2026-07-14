'use client';

import { Button } from './button';

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
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-safe backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="app-shell mb-4 w-full rounded-3xl border border-white/10 bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
        <p className="mt-1.5 text-sm text-textMuted">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={danger ? 'bg-danger text-ink hover:bg-danger/90' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
