'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Dumbbell, History, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

const TABS = [
  { href: '/entreno', label: 'Entreno', icon: Dumbbell },
  { href: '/rutinas', label: 'Rutinas', icon: ClipboardList },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/progreso', label: 'Progreso', icon: TrendingUp },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-surface/95 pb-safe backdrop-blur">
      <ul className="app-shell flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition',
                  active ? 'text-primary' : 'text-textMuted hover:text-text',
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
