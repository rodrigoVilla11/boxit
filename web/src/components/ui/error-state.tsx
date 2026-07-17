'use client';

import { RotateCw } from 'lucide-react';

/** Bloque de error de carga con reintento. */
export function ErrorState({
  message = 'No pudimos cargar los datos.',
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-textMuted">
        <RotateCw className="h-7 w-7" />
      </div>
      <p className="max-w-[18rem] text-sm text-textMuted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-ink transition hover:bg-primary-deep active:scale-95"
      >
        <RotateCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}
