'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { SwitchVisual } from '@/components/ui/switch';
import { useToast } from '@/components/toast-provider';
import { updateProfile } from '@/lib/auth';
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

  useEffect(() => {
    if (!pushSupported()) {
      setSupported(false);
      return;
    }
    setDenied(currentPermission() === 'denied');
    isSubscribed()
      .then(setOn)
      .catch(() => undefined);
  }, []);

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
        <button
          type="button"
          onClick={test}
          className="ml-1 text-xs font-semibold text-primary transition hover:text-primary-deep"
        >
          Enviar notificación de prueba
        </button>
      )}
    </div>
  );
}
