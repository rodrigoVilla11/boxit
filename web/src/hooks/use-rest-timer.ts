'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_REST = 90;

export type RestTimer = {
  seconds: number;
  active: boolean;
  start: (seconds?: number) => void;
  add: (seconds?: number) => void;
  skip: () => void;
};

/** Rest timer: cuenta regresiva, con +15s y saltar. Vibra al terminar (si se puede). */
export function useRestTimer(): RestTimer {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const vibratedRef = useRef(false);

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt]);

  const remaining =
    endAt === null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000));

  useEffect(() => {
    if (endAt !== null && remaining <= 0) {
      if (!vibratedRef.current && typeof navigator !== 'undefined') {
        navigator.vibrate?.(200);
        vibratedRef.current = true;
      }
      setEndAt(null);
    }
  }, [endAt, remaining]);

  const start = useCallback((seconds = DEFAULT_REST) => {
    vibratedRef.current = false;
    setNow(Date.now());
    setEndAt(Date.now() + seconds * 1000);
  }, []);

  const add = useCallback((seconds = 15) => {
    setEndAt((prev) => (prev ?? Date.now()) + seconds * 1000);
  }, []);

  const skip = useCallback(() => setEndAt(null), []);

  return { seconds: remaining, active: endAt !== null, start, add, skip };
}
