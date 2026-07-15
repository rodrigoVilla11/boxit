'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, LogOut, Minus, Plus, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useUnit } from '@/components/unit-provider';
import { usePreferences } from '@/components/preferences-provider';
import { getMe, logout, type SessionUser } from '@/lib/auth';
import type { WeightUnit } from '@/lib/units';

const UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'KG', label: 'Kilos (kg)' },
  { value: 'LB', label: 'Libras (lb)' },
];

export default function AjustesPage() {
  const router = useRouter();
  const { unit, setUnit } = useUnit();
  const prefs = usePreferences();
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

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-textMuted">Descanso</h2>
        <div className="space-y-2">
          <ToggleRow
            icon={<Volume2 className="h-5 w-5 shrink-0 text-primary" />}
            title="Sonido al terminar"
            subtitle="Un beep cuando se acaba el descanso."
            on={prefs.sound}
            onToggle={() => prefs.setSound(!prefs.sound)}
          />
          <ToggleRow
            icon={<Bell className="h-5 w-5 shrink-0 text-primary" />}
            title="Notificación al terminar"
            subtitle="Aviso aunque tengas la app en segundo plano."
            on={prefs.notifications}
            onToggle={() => prefs.setNotifications(!prefs.notifications)}
          />
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text">
                Descanso por defecto
              </span>
              <span className="block text-xs text-textMuted">
                Se arranca al completar una serie.
              </span>
            </span>
            <button
              type="button"
              aria-label="Restar 15s"
              onClick={() => prefs.setDefaultRest(prefs.defaultRest - 15)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center font-display text-base font-semibold tabular-nums text-text">
              {Math.floor(prefs.defaultRest / 60)}:
              {String(prefs.defaultRest % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              aria-label="Sumar 15s"
              onClick={() => prefs.setDefaultRest(prefs.defaultRest + 15)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
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

function ToggleRow({
  icon,
  title,
  subtitle,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{title}</span>
        <span className="block text-xs text-textMuted">{subtitle}</span>
      </span>
      <span
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition',
          on ? 'bg-primary' : 'bg-surfaceRaised',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
            on ? 'left-[1.125rem]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
