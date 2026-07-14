'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, LogOut, Timer, TrendingUp } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { getExercises, getMe, logout, type SessionUser } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const me = await getMe();
      if (!alive) return;
      if (!me) {
        router.replace('/login');
        return;
      }
      setUser(me);
      setReady(true);
      const exercises = await getExercises();
      if (alive) setCount(exercises.length);
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
    router.refresh();
  }

  if (!ready || !user) {
    return (
      <main className="app-shell flex min-h-dvh items-center justify-center">
        <BrandMark className="animate-pulse text-4xl" />
      </main>
    );
  }

  return (
    <main className="app-shell min-h-dvh px-5 pt-safe pb-safe">
      <div className="flex min-h-dvh flex-col pt-12 pb-10">
        <header className="flex items-start justify-between">
          <div className="space-y-1">
            <BrandMark className="text-3xl" />
            <p className="text-sm text-textMuted">
              Hola,{' '}
              <span className="font-semibold text-text">{user.name}</span> 👋
            </p>
          </div>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-danger disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <section className="mt-8 space-y-3">
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-accentLime" />
                <span className="text-sm text-textMuted">Librería de ejercicios</span>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                {count ?? '—'} ejercicios
              </span>
            </div>
          </div>

          <FeatureRow
            icon={<Timer className="h-5 w-5 text-primary" />}
            title="Entreno en vivo"
            desc="Timer, rest timer y volumen en tiempo real."
          />
          <FeatureRow
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Historial y PRs"
            desc="Tus mejores marcas, destacadas."
          />
        </section>

        <div className="flex-1" />

        <footer className="pt-8 text-center">
          <p className="text-xs text-textMuted">
            Fase 2 · Sesión activa con JWT en cookies httpOnly.
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-text">{title}</p>
        <p className="truncate text-xs text-textMuted">{desc}</p>
      </div>
      <span className="shrink-0 rounded-full bg-surfaceRaised px-2.5 py-1 text-[11px] font-medium text-textMuted">
        pronto
      </span>
    </div>
  );
}
