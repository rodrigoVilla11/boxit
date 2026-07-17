'use client';

import { useRestTimerCtx } from './rest-timer-provider';

/** Reserva espacio al final del scroll para que la barra de descanso (fixed,
 *  global) no tape el contenido inferior en ninguna pantalla. */
export function RestSpacer() {
  const rest = useRestTimerCtx();
  return rest.active ? <div className="h-16" aria-hidden /> : null;
}
