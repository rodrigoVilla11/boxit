'use client';

import { useEffect, useState } from 'react';

/** Devuelve Date.now() actualizándose cada `intervalMs` (para timers en vivo). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
