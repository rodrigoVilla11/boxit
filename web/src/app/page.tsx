import { Dumbbell, Timer, TrendingUp, WifiOff } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { getExerciseCount } from '@/lib/api';

export default async function HomePage() {
  const exerciseCount = await getExerciseCount();

  return (
    <main className="app-shell min-h-dvh px-5 pt-safe pb-safe">
      <div className="flex min-h-dvh flex-col pt-14 pb-10">
        {/* Marca */}
        <header className="flex flex-col items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <BrandMark className="text-5xl" />
          <p className="text-textMuted text-base">
            Trackeá tus entrenos, serie por serie.
          </p>
        </header>

        {/* Estado del scaffolding */}
        <section className="mt-10 space-y-3">
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-accentLime" />
                <span className="text-sm text-textMuted">Librería de ejercicios</span>
              </div>
              {exerciseCount === null ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-textMuted">
                  <WifiOff className="h-4 w-4" />
                  API offline
                </span>
              ) : (
                <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                  {exerciseCount} ejercicios
                </span>
              )}
            </div>
          </div>

          <FeatureRow
            icon={<Timer className="h-5 w-5 text-primary" />}
            title="Entreno en vivo"
            desc="Timer, rest timer y volumen en tiempo real."
            soon
          />
          <FeatureRow
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Historial y PRs"
            desc="Tus mejores marcas, destacadas."
            soon
          />
        </section>

        <div className="flex-1" />

        {/* Pie */}
        <footer className="pt-8 text-center">
          <p className="text-xs text-textMuted">
            Fase 1 · Scaffolding listo. Instalable como app desde el navegador.
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
  soon,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  soon?: boolean;
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
      {soon && (
        <span className="shrink-0 rounded-full bg-surfaceRaised px-2.5 py-1 text-[11px] font-medium text-textMuted">
          pronto
        </span>
      )}
    </div>
  );
}
