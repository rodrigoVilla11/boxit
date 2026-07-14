import { WifiOff } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';

export const metadata = {
  title: 'Sin conexión',
};

export default function OfflinePage() {
  return (
    <main className="app-shell flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-surface shadow-card">
        <WifiOff className="h-8 w-8 text-textMuted" />
      </div>
      <BrandMark className="text-3xl" />
      <h1 className="mt-4 font-display text-lg font-semibold text-text">
        Estás sin conexión
      </h1>
      <p className="mt-2 max-w-xs text-sm text-textMuted">
        No hay internet ahora. Cuando vuelva la conexión vas a poder seguir con tu
        entreno.
      </p>
    </main>
  );
}
