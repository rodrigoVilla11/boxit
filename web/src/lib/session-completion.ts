// Empareja lo PROGRAMADO (calendario) con lo REALMENTE HECHO (entrenos y
// actividades). Reglas:
//  - Una sesión se cumple sólo con esa misma rutina / ese mismo tipo de cardio.
//    Si ese día hiciste otra cosa, la sesión queda pendiente y lo hecho aparece
//    como "no agendado" (igual suma para la Constancia).
//  - Se permite recuperar: si no hay nada ese día, vale un día POSTERIOR de la
//    misma semana (lunes a domingo).
//  - Cada entreno/actividad cumple como mucho una sesión programada.

import { dayKey, mondayOf, startOfDay } from './week';
import { sessionDay, sessionTargets, type ScheduledSession } from './schedule';
import { activityLabel } from './activity';
import type { Activity, ActivityType } from './activities';
import type { WorkoutSummary } from './workouts';

/** Algo que efectivamente hiciste, normalizado para poder emparejarlo. */
export type Effort = {
  id: string;
  kind: 'ROUTINE' | 'ACTIVITY';
  dayK: number;
  weekK: number; // dayKey del lunes de su semana
  /** ROUTINE: rutina de origen (null = entreno suelto, no empareja con nada). */
  routineId: string | null;
  /** ACTIVITY: tipo de cardio. */
  activityType: ActivityType | null;
  label: string;
};

export type SessionStatus =
  | 'done' // hecha el día programado
  | 'madeUp' // recuperada otro día de la misma semana
  | 'pending' // todavía por hacer (hoy o futuro)
  | 'missed'; // pasó el día y no se hizo

export type SessionOutcome = {
  session: ScheduledSession;
  status: SessionStatus;
  /** dayKey del día en que se cumplió (sólo en 'done' / 'madeUp'). */
  doneOnK: number | null;
};

export type DayCompletion = {
  outcomes: SessionOutcome[]; // en el orden del calendario
  extras: Effort[]; // hecho ese día pero no agendado
  planned: number;
  done: number; // sesiones cumplidas (incluye recuperadas)
};

/** Identidad de una sesión: con qué se cumple. null = no se puede emparejar. */
function sessionMatchKey(s: ScheduledSession): string | null {
  if (s.kind === 'ROUTINE') return s.routineId ? `R:${s.routineId}` : null;
  if (s.kind === 'ACTIVITY') {
    const { type } = sessionTargets(s);
    return type ? `A:${type}` : null;
  }
  return null; // REST: no se cumple con nada
}

const effortMatchKey = (e: Effort): string | null =>
  e.kind === 'ROUTINE'
    ? e.routineId
      ? `R:${e.routineId}`
      : null
    : e.activityType
      ? `A:${e.activityType}`
      : null;

export function toEfforts(
  workouts: WorkoutSummary[],
  activities: Activity[],
): Effort[] {
  const out: Effort[] = [];
  const push = (
    id: string,
    date: Date,
    rest: Omit<Effort, 'id' | 'dayK' | 'weekK'>,
  ) => {
    out.push({ id, dayK: dayKey(date), weekK: dayKey(mondayOf(date)), ...rest });
  };
  for (const w of workouts) {
    if (!w.finishedAt) continue;
    push(`w:${w.id}`, new Date(w.finishedAt), {
      kind: 'ROUTINE',
      routineId: w.routineId,
      activityType: null,
      label: w.title ?? w.routine?.name ?? 'Entreno',
    });
  }
  for (const a of activities) {
    push(`a:${a.id}`, new Date(a.performedAt), {
      kind: 'ACTIVITY',
      routineId: null,
      activityType: a.type,
      label: a.label ?? activityLabel(a.type),
    });
  }
  return out;
}

/**
 * Estado por día del rango `[fromK, toK]` (dayKeys). `efforts` puede traer todo
 * el historial: sólo se reportan los días del rango.
 */
export function computeDayCompletion(
  sessions: ScheduledSession[],
  efforts: Effort[],
  range: { fromK: number; toK: number },
  now: Date = new Date(),
): Map<number, DayCompletion> {
  const todayK = dayKey(startOfDay(now));

  // Esfuerzos disponibles agrupados por identidad, del más viejo al más nuevo.
  const pool = new Map<string, Effort[]>();
  for (const e of efforts) {
    const key = effortMatchKey(e);
    if (!key) continue;
    const list = pool.get(key) ?? [];
    list.push(e);
    pool.set(key, list);
  }
  for (const list of pool.values()) list.sort((a, b) => a.dayK - b.dayK);
  const used = new Set<string>();

  type Slot = { s: ScheduledSession; dayK: number; weekK: number };
  const slots: Slot[] = sessions
    .map((s) => {
      const d = sessionDay(s.date);
      return { s, dayK: dayKey(d), weekK: dayKey(mondayOf(d)) };
    })
    .sort((a, b) => a.dayK - b.dayK || a.s.order - b.s.order);
  const matched = new Map<string, Effort>();

  const take = (slot: Slot, pick: (e: Effort) => boolean): void => {
    const key = sessionMatchKey(slot.s);
    if (!key) return;
    const hit = pool.get(key)?.find((e) => !used.has(e.id) && pick(e));
    if (!hit) return;
    used.add(hit.id);
    matched.set(slot.s.id, hit);
  };

  // 1ª pasada: mismo día (tiene prioridad sobre cualquier recuperación).
  for (const slot of slots) take(slot, (e) => e.dayK === slot.dayK);
  // 2ª pasada: recuperación en un día posterior de la MISMA semana.
  for (const slot of slots) {
    if (matched.has(slot.s.id)) continue;
    take(
      slot,
      (e) => e.dayK > slot.dayK && e.dayK <= todayK && e.weekK === slot.weekK,
    );
  }

  const byDay = new Map<number, DayCompletion>();
  const dayOf = (k: number): DayCompletion => {
    const d = byDay.get(k) ?? { outcomes: [], extras: [], planned: 0, done: 0 };
    byDay.set(k, d);
    return d;
  };

  for (const slot of slots) {
    const hit = matched.get(slot.s.id);
    const status: SessionStatus = hit
      ? hit.dayK === slot.dayK
        ? 'done'
        : 'madeUp'
      : slot.dayK < todayK
        ? 'missed'
        : 'pending';
    const day = dayOf(slot.dayK);
    day.outcomes.push({ session: slot.s, status, doneOnK: hit?.dayK ?? null });
    day.planned++;
    if (hit) day.done++;
  }

  // Lo hecho que no cerró ninguna sesión: "no agendado" en su propio día.
  for (const e of efforts) {
    if (used.has(e.id)) continue;
    if (e.dayK < range.fromK || e.dayK > range.toK) continue;
    dayOf(e.dayK).extras.push(e);
  }

  return byDay;
}
