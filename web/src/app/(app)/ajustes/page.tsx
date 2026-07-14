'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useUnit } from '@/components/unit-provider';
import { getMe, logout, type SessionUser } from '@/lib/auth';
import type { WeightUnit } from '@/lib/units';

const UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'KG', label: 'Kilos (kg)' },
  { value: 'LB', label: 'Libras (lb)' },
];

export default function AjustesPage() {
  const router = useRouter();
  const { unit, setUnit } = useUnit();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {});
  }, []);

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-1 pt-safe">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:text-text"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="mt-5 font-display text-xl font-bold text-text">Ajustes</h1>
      </header>

      {user && (
        <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
          <p className="font-display font-semibold text-text">{user.name}</p>
          <p className="text-sm text-textMuted">{user.email}</p>
        </div>
      )}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-textMuted">Unidad de peso</h2>
        <div className="flex gap-1 rounded-2xl bg-surface p-1">
          {UNITS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setUnit(u.value)}
              aria-pressed={unit === u.value}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
                unit === u.value
                  ? 'bg-primary text-ink'
                  : 'text-textMuted hover:text-text',
              )}
            >
              {u.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-textMuted">
          Los pesos se guardan en kg; el cambio es solo de visualización.
        </p>
      </section>

      <div className="mt-auto pb-6 pt-8">
        <Button variant="ghost" onClick={onLogout} loading={loggingOut}>
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
