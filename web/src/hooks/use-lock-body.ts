'use client';

import { useEffect } from 'react';

/**
 * Bloquea el scroll del body mientras `locked` (para sheets/diálogos), evitando
 * el scroll-chaining y el rubber-band de la página de fondo en mobile.
 */
export function useLockBody(locked = true): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
