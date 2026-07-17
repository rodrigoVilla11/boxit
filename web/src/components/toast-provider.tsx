'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastType = 'error' | 'success' | 'info';
type ToastItem = { id: number; type: ToastType; message: string };

type ToastContextValue = { show: (message: string, type: ToastType) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

let seq = 0;

const STYLES: Record<ToastType, { ring: string; icon: React.ReactNode }> = {
  error: {
    ring: 'ring-danger/40',
    icon: <AlertCircle className="h-5 w-5 shrink-0 text-danger" />,
  },
  success: {
    ring: 'ring-primary/40',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />,
  },
  info: {
    ring: 'ring-white/10',
    icon: <Info className="h-5 w-5 shrink-0 text-textMuted" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType) => {
      const id = ++seq;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] px-4 pt-safe">
        <div className="app-shell mx-auto flex flex-col gap-2 pt-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={cn(
                // el cuerpo no intercepta taps (deja pasar al header debajo); sólo la X sí
                'pointer-events-none flex items-center gap-2.5 rounded-2xl bg-surfaceRaised px-4 py-3 text-sm text-text shadow-card ring-1',
                STYLES[t.type].ring,
              )}
            >
              {STYLES[t.type].icon}
              <span className="min-w-0 flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar"
                className="pointer-events-auto shrink-0 text-textMuted transition hover:text-text active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

/** Hook para mostrar avisos. Fuera del provider, es un no-op seguro. */
export function useToast() {
  const ctx = useContext(ToastContext);
  const show = ctx?.show ?? (() => {});
  return {
    error: (m: string) => show(m, 'error'),
    success: (m: string) => show(m, 'success'),
    info: (m: string) => show(m, 'info'),
  };
}
