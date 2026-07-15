'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePreferences } from './preferences-provider';
import { RestTimerBar } from './workout/rest-timer-bar';

const STORAGE_KEY = 'boxit_rest_endat';

export type RestTimer = {
  seconds: number;
  active: boolean;
  start: (seconds?: number) => void;
  add: (seconds?: number) => void;
  skip: () => void;
};

const RestTimerContext = createContext<RestTimer | null>(null);

/** Beep corto con WebAudio (sin assets). Silencioso si algo falla. */
function playBeep() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    /* audio no disponible */
  }
}

function notify(body: string) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Descanso terminado', { body });
    }
  } catch {
    /* notificaciones no disponibles */
  }
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const prefs = usePreferences();
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  // Referencia a prefs para el efecto de "terminó" sin re-suscribir el intervalo.
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // Rehidrata un descanso en curso al montar (persistió entre pantallas/refresh).
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const v = Number(raw);
    if (Number.isFinite(v) && v > Date.now()) {
      firedRef.current = false;
      setNow(Date.now());
      setEndAt(v);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt]);

  const remaining =
    endAt === null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000));

  useEffect(() => {
    if (endAt !== null && remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        navigator.vibrate?.(200);
        if (prefsRef.current.sound) playBeep();
        if (prefsRef.current.notifications) notify('Dale que sigue la próxima serie.');
      }
      setEndAt(null);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [endAt, remaining]);

  const persist = (end: number | null) => {
    if (end === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(end));
  };

  const start = useCallback(
    (seconds?: number) => {
      const secs = seconds ?? prefsRef.current.defaultRest;
      if (secs <= 0) return;
      firedRef.current = false;
      const end = Date.now() + secs * 1000;
      setNow(Date.now());
      setEndAt(end);
      persist(end);
    },
    [],
  );

  const add = useCallback((seconds = 15) => {
    setEndAt((prev) => {
      const end = (prev ?? Date.now()) + seconds * 1000;
      persist(end);
      return end;
    });
  }, []);

  const skip = useCallback(() => {
    setEndAt(null);
    persist(null);
  }, []);

  return (
    <RestTimerContext.Provider
      value={{ seconds: remaining, active: endAt !== null, start, add, skip }}
    >
      {children}
      {endAt !== null && (
        <RestTimerBar seconds={remaining} onAdd={() => add(15)} onSkip={skip} />
      )}
    </RestTimerContext.Provider>
  );
}

export function useRestTimerCtx(): RestTimer {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error('useRestTimerCtx requiere <RestTimerProvider>');
  return ctx;
}
