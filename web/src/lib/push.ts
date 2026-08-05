import { apiFetch } from './api-client';

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/** La clave VAPID viaja en base64url; el navegador la quiere como Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID
  );
}

export function currentPermission(): NotificationPermission {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  return !!(await reg.pushManager.getSubscription());
}

/** Pide permiso, suscribe el dispositivo y lo registra en la API. */
export async function subscribe(): Promise<boolean> {
  if (!pushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID),
    }));
  const json = sub.toJSON();
  const res = await apiFetch('/api/push/subscriptions', {
    method: 'POST',
    // el DTO no acepta expirationTime: mandamos sólo endpoint + keys
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return res.ok;
}

/** Desuscribe el dispositivo (navegador + API). */
export async function unsubscribe(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  const { endpoint } = sub;
  await sub.unsubscribe().catch(() => undefined);
  await apiFetch('/api/push/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
  return true;
}

/** Dispara una notificación de prueba a los dispositivos del usuario. */
export async function sendTestPush(): Promise<void> {
  await apiFetch('/api/push/test', { method: 'POST' });
}
