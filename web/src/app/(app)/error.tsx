'use client';

import { RotateCw } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
      <BrandMark className="text-3xl" />
      <p className="max-w-[16rem] text-sm text-textMuted">
        Algo se rompió. Probá de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-ink transition hover:bg-primary-deep"
      >
        <RotateCw className="h-5 w-5" />
        Reintentar
      </button>
    </div>
  );
}
