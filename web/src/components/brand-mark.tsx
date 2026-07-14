import { cn } from '@/lib/cn';

/** Wordmark "BOX iT" — la T va en minúscula, "iT" en verde. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display font-bold tracking-tight leading-none select-none',
        className,
      )}
    >
      <span className="text-text">BOX </span>
      <span className="text-primary">iT</span>
    </span>
  );
}
