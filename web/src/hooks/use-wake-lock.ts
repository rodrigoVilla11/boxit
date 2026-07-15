'use client';

import { useEffect } from 'react';

type WakeLockSentinelLike = { release: () => Promise<void> };

/**
 * Mantiene la pantalla encendida mientras `active` (p. ej. durante un entreno).
 * Re-adquiere el lock al volver a la pestaña (el navegador lo suelta al ocultar).
 * No hace nada si la API no está disponible.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let released = false;

    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };

    const request = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === 'visible' && !sentinel) {
          sentinel = await nav.wakeLock.request('screen');
        }
      } catch {
        /* denegado o no soportado */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}
