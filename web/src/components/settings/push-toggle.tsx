'use client';

import { useEffect, useState } from 'react';
import { BellRing, Minus, Plus } from 'lucide-react';
import { SwitchVisual } from '@/components/ui/switch';
import { useToast } from '@/components/toast-provider';
import { cn } from '@/lib/cn';
import { getMe, updateProfile } from '@/lib/auth';
import {
  currentPermission,
  isSubscribed,
  pushSupported,
  sendTestPush,
  subscribe,
  unsubscribe,
} from '@/lib/push';

/** Toggle de recordatorios Web Push, con estado de permiso y prueba. */
export function PushToggle() {
  const toast = useToast();
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [hour, setHour] = useState(19);
  const [inactivity, setInactivity] = useState<number | null>(null);

  useEffect(() => {
    if (!pushSupported()) {
      setSupported(false);
      return;
    }
    setDenied(currentPermission() === 'denied');
    isSubscribed()
      .then(setOn)
      .catch(() => undefined);
    getMe()
      .then((u) => {
        if (u) {
          setHour(u.reminderHour);
          setInactivity(u.inactivityReminderDays);
        }
      })
      .catch(() => undefined);
  }, []);

  const changeHour = (delta: number) => {
    const next = (hour + delta + 24) % 24;
    setHour(next);
    updateProfile({ reminderHour: next }).catch(() => undefined);
  };
  const changeInactivity = (days: number | null) => {
    setInactivity(days);
    updateProfile({ inactivityReminderDays: days }).catch(() => undefined);
  };
  const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

  if (!supported) return null;

  async function toggle() {
    if (busy || denied) return;
    setBusy(true);
    try {
      if (on) {
        await unsubscribe();
        await updateProfile({ reminderEnabled: false }).catch(() => undefined);
        setOn(false);
      } else {
        const ok = await subscribe();
        setOn(ok);
        if (ok) {
          // habilita el cron y guarda el huso horario del dispositivo
          await updateProfile({
            reminderEnabled: true,
            timezoneOffsetMin: new Date().getTimezoneOffset(),
          }).catch(() => undefined);
          toast.success('Recordatorios activados.');
        } else {
          setDenied(currentPermission() === 'denied');
          toast.error('No se pudo activar. Revisá los permisos del navegador.');
        }
      }
    } catch {
      toast.error('No se pudo cambiar la configuración.');
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    try {
      await sendTestPush();
      toast.success('Notificación de prueba enviada.');
    } catch {
      toast.error('No se pudo enviar la prueba.');
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || denied}
        aria-pressed={on}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition active:scale-[0.99] disabled:opacity-60"
      >
        <BellRing className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-text">
            Recordatorios de entreno
          </span>
          <span className="block text-xs text-textMuted">
            {denied
              ? 'Bloqueado en el navegador. Habilitá las notificaciones para BOX iT.'
              : 'Te avisamos qué toca entrenar cada día.'}
          </span>
        </span>
        <SwitchVisual on={on} />
      </button>
      {on && (
        <div className="space-y-3 rounded-2xl bg-surface p-3">
          {/* Hora del aviso */}
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text">Hora del aviso</span>
              <span className="block text-xs text-textMuted">
                Cuándo te llega el «hoy toca».
              </span>
            </span>
            <button
              type="button"
              aria-label="Una hora menos"
              onClick={() => changeHour(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center font-display text-base font-semibold tabular-nums text-text">
              {hh(hour)}
            </span>
            <button
              type="button"
              aria-label="Una hora más"
              onClick={() => changeHour(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Aviso de inactividad */}
          <div>
            <span className="block text-sm font-medium text-text">
              Avisarme si no entreno
            </span>
            <div className="mt-1.5 flex gap-2">
              {[null, 3, 5, 7].map((d) => (
                <button
                  key={d ?? 'off'}
                  type="button"
                  onClick={() => changeInactivity(d)}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-xs font-semibold transition active:scale-95',
                    inactivity === d
                      ? 'bg-primary text-ink'
                      : 'bg-surfaceRaised text-textMuted',
                  )}
                >
                  {d === null ? 'Nunca' : `${d} días`}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={test}
            className="text-xs font-semibold text-primary transition hover:text-primary-deep"
          >
            Enviar notificación de prueba
          </button>
        </div>
      )}
    </div>
  );
}
