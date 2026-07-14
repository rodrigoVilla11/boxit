import type { LucideIcon } from 'lucide-react';

export function ComingSoon({
  title,
  icon: Icon,
  desc,
}: {
  title: string;
  icon: LucideIcon;
  desc: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">{title}</h1>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-textMuted">
          <Icon className="h-7 w-7" />
        </div>
        <p className="max-w-[16rem] text-sm text-textMuted">{desc}</p>
        <span className="mt-3 rounded-full bg-surfaceRaised px-3 py-1 text-xs font-medium text-textMuted">
          pronto
        </span>
      </div>
    </div>
  );
}
