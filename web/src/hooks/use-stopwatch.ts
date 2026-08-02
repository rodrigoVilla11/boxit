'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'boxit_activity_stopwatch';

type State = { startedAt: number | null; accumulatedMs: number; running: boolean };
const INITIAL: State = { startedAt: null, accumulatedMs: 0, running: false };

function read(): State {
  if (typeof window === 'undefined') return INITIAL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL;
  } catch {
    return INITIAL;
  }
}

export type Stopwatch = {
  elapsedSec: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

/**
 * Cronómetro count-up persistido en localStorage: sobrevive navegación y
 * refresh (usa un timestamp absoluto). Cuenta el tiempo aunque la pestaña se
 * cierre mientras corre — correcto para cronometrar una actividad real.
 */
export function useStopwatch(): Stopwatch {
  const [state, setState] = useState<State>(INITIAL);
  const [, setTick] = useState(0);

  useEffect(() => {
    setState(read());
  }, []);

  // Tick en vivo sólo mientras corre
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  const save = (next: State) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* localStorage no disponible */
    }
  };

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.running) return prev;
      const next = { ...prev, startedAt: Date.now(), running: true };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.running) return prev;
      const acc =
        prev.accumulatedMs + (prev.startedAt ? Date.now() - prev.startedAt : 0);
      const next = { startedAt: null, accumulatedMs: acc, running: false };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => save(INITIAL), []);

  const elapsedMs =
    state.accumulatedMs +
    (state.running && state.startedAt ? Date.now() - state.startedAt : 0);

  return {
    elapsedSec: Math.floor(elapsedMs / 1000),
    running: state.running,
    start,
    pause,
    reset,
  };
}
