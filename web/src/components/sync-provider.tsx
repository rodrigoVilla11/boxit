'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useToast } from './toast-provider';
import { getQueue, queueSize, removeOp, syncOp } from '@/lib/offline/active-store';
import type { QueuedOp } from '@/lib/offline/types';

type SyncContextValue = {
  online: boolean;
  pending: number;
  syncing: boolean;
  kick: () => void; // dispara un drenaje (lo llama el hook tras cada commit)
};

const SyncContext = createContext<SyncContextValue | null>(null);

function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = e instanceof Error ? e.message : '';
  return e instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(msg);
}

// updateSet consecutivos del mismo set → sólo importa el último (last-writer-wins)
function collapsible(a: QueuedOp, b: QueuedOp | undefined): boolean {
  return (
    !!b &&
    a.kind === 'updateSet' &&
    b.kind === 'updateSet' &&
    a.setId === b.setId
  );
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const draining = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      setPending(await queueSize());
    } catch {
      /* IndexedDB no disponible */
    }
  }, []);

  const drain = useCallback(async () => {
    if (draining.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    draining.current = true;
    setSyncing(true);
    let deadLettered = false;
    try {
      let queue = await getQueue();
      while (queue.length > 0) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) break;
        const op = queue[0];
        // colapsa updateSet consecutivos del mismo set
        if (collapsible(op, queue[1])) {
          await removeOp(op.seq);
          queue = queue.slice(1);
          continue;
        }
        try {
          await syncOp(op);
          await removeOp(op.seq);
        } catch (e) {
          if (isNetworkError(e)) break; // se reintenta al reconectar
          // Error del server (no de red): dead-letter para no bloquear la cola.
          await removeOp(op.seq);
          deadLettered = true;
        }
        queue = queue.slice(1);
      }
    } catch {
      /* problema leyendo la cola: reintentamos luego */
    } finally {
      draining.current = false;
      setSyncing(false);
      await refreshPending();
      if (deadLettered) {
        toast.error('Algunos cambios no se pudieron sincronizar.');
      }
    }
  }, [refreshPending, toast]);

  const kick = useCallback(() => {
    refreshPending();
    void drain();
  }, [drain, refreshPending]);

  useEffect(() => {
    refreshPending();
    void drain();

    const goOnline = () => {
      setOnline(true);
      void drain();
    };
    const goOffline = () => setOnline(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void drain();
    };

    if (typeof navigator !== 'undefined') setOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    document.addEventListener('visibilitychange', onVisible);
    // reintento periódico si quedaron cambios pendientes
    const interval = window.setInterval(() => void drain(), 8000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [drain, refreshPending]);

  return (
    <SyncContext.Provider value={{ online, pending, syncing, kick }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  return (
    useContext(SyncContext) ?? {
      online: true,
      pending: 0,
      syncing: false,
      kick: () => {},
    }
  );
}
