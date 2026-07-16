'use client';

import { CloudOff, RefreshCw } from 'lucide-react';
import { useSync } from './sync-provider';

/** Pill de estado: sin conexión, o sincronizando cambios pendientes. */
export function OfflineIndicator() {
  const { online, pending, syncing } = useSync();

  const offline = !online;
  const show = offline || pending > 0;
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center pt-safe">
      <div className="app-shell flex w-full justify-center px-4 pt-2">
        {offline ? (
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-surfaceRaised/95 px-3 py-1.5 text-xs font-semibold text-textMuted shadow-card backdrop-blur">
            <CloudOff className="h-4 w-4" />
            Sin conexión — se guarda local
          </span>
        ) : (
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surfaceRaised/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-card backdrop-blur">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizando {pending}
          </span>
        )}
      </div>
    </div>
  );
}
