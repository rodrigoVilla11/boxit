'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'boxit_prefs';

export type Preferences = {
  sound: boolean;
  notifications: boolean;
  defaultRest: number; // segundos
};

type PreferencesContextValue = Preferences & {
  setSound: (v: boolean) => void;
  setNotifications: (v: boolean) => Promise<void> | void;
  setDefaultRest: (v: number) => void;
};

const DEFAULTS: Preferences = { sound: true, notifications: false, defaultRest: 90 };

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function read(): Preferences {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    setPrefs(read());
  }, []);

  const save = (p: Preferences) => {
    setPrefs(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* localStorage lleno o bloqueado: seguimos con el estado en memoria */
    }
  };

  const setSound = (v: boolean) => save({ ...prefs, sound: v });
  const setDefaultRest = (v: number) =>
    save({ ...prefs, defaultRest: Math.min(600, Math.max(0, v)) });

  // Al activar notificaciones pedimos permiso; si lo niegan, queda en off.
  const setNotifications = async (v: boolean) => {
    if (v && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          save({ ...prefs, notifications: false });
          return;
        }
      } catch {
        save({ ...prefs, notifications: false });
        return;
      }
    }
    save({ ...prefs, notifications: v });
  };

  return (
    <PreferencesContext.Provider
      value={{ ...prefs, setSound, setNotifications, setDefaultRest }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  return (
    useContext(PreferencesContext) ?? {
      ...DEFAULTS,
      setSound: () => {},
      setNotifications: () => {},
      setDefaultRest: () => {},
    }
  );
}
