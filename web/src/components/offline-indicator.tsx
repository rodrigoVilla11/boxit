'use client';

import { CloudOff, RefreshCw } from 'lucide-react';
import { useSync } from './sync-provider';
import { useRestTimerCtx } from './rest-timer-provider';

/** Pill de estado: sin conexión, o sincronizando cambios pendientes. */
export function OfflineIndicator() {
  const { online, pending, syncing } = useSync();
  const rest = useRestTimerCtx();

  const offline = !online;
  const show = offline || pending > 0;
  if (!show) return null;

  // Anclado abajo, sobre la tab bar; si hay descanso activo, por encima de su barra.
  const bottom = rest.active
    ? 'bottom-[calc(7.5rem+env(safe-area-inset-bottom))]'
    : 'bottom-[calc(4.25rem+env(safe-area-inset-bottom))]';

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 ${bottom}`}
      aria-live="polite"
    >
      {offline ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surfaceRaised/95 px-3 py-1.5 text-xs font-semibold text-textMuted shadow-card backdrop-blur">
          <CloudOff className="h-4 w-4" />
          Sin conexión — se guarda local
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surfaceRaised/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-card backdrop-blur">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          Sincronizando {pending} {pending === 1 ? 'cambio' : 'cambios'}
        </span>
      )}
    </div>
  );
}
