import type { ActivityType } from './activities';
import { toDayStr, type ScheduledSessionInput } from './schedule';
import { mondayOf, startOfDay } from './week';

/**
 * Catálogo estático de programas multi-semana pre-armados (el equivalente de
 * routine-templates pero con progresión semanal). Al elegir uno, el wizard
 * genera TODAS las sesiones con fecha y las manda de una a POST /programs.
 */
export type TemplateSession = {
  title: string; // "Técnica", "Series", "Fondo"...
  type: ActivityType;
  distanceM?: number; // objetivo total de la sesión
  durationSec?: number;
  note: string; // el set principal, en texto ("6 × 100 m (30 s desc.)")
};

export type TemplateWeek = {
  focus?: string; // "Recuperación", "Semana de prueba"...
  sessions: TemplateSession[]; // longitud = sessionsPerWeek
};

export type ProgramTemplate = {
  id: string;
  name: string;
  sport: string;
  goal: string;
  summary: string;
  sessionsPerWeek: number;
  defaultDays: number[]; // dow 0=lunes; longitud = sessionsPerWeek
  weeks: TemplateWeek[];
};

const swim = (title: string, distanceM: number, note: string): TemplateSession => ({
  title,
  type: 'SWIM',
  distanceM,
  note,
});

const run = (
  title: string,
  note: string,
  target: { distanceM?: number; durationSec?: number },
): TemplateSession => ({ title, type: 'RUN', note, ...target });

/** Semana estándar del plan de natación: técnica / series / fondo. */
const swimWeek = (
  tec: [number, string],
  ser: [number, string],
  fondo: [number, string],
  focus?: string,
): TemplateWeek => ({
  focus,
  sessions: [
    swim('Técnica', tec[0], tec[1]),
    swim('Series', ser[0], ser[1]),
    swim('Fondo', fondo[0], fondo[1]),
  ],
});

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'swim-16w-resistencia',
    name: 'Natación · 16 semanas de resistencia',
    sport: 'Natación',
    goal: 'Nadar 1500 m continuos',
    summary:
      '3 sesiones por semana (técnica, series y fondo) con progresión y semanas de descarga. Termina con un test de 1500 m.',
    sessionsPerWeek: 3,
    defaultDays: [0, 2, 4], // Lun / Mié / Vie
    weeks: [
      swimWeek(
        [800, 'Calentamiento 200 m + 6 × 50 m técnica (patada, punto muerto) + 200 m suave'],
        [600, '8 × 50 m con 30 s de descanso, ritmo cómodo'],
        [600, '3 × 200 m continuos con 60 s de descanso'],
      ),
      swimWeek(
        [900, 'Calentamiento 200 m + 8 × 50 m técnica (respiración bilateral) + 300 m suave'],
        [800, '6 × 100 m con 40 s de descanso'],
        [800, '2 × 400 m con 90 s de descanso'],
      ),
      swimWeek(
        [1000, 'Calentamiento 300 m + 8 × 50 m técnica (rolido) + 300 m suave'],
        [1000, '8 × 100 m con 30 s de descanso'],
        [1000, '1000 m continuos a ritmo tranquilo'],
      ),
      swimWeek(
        [800, 'Todo suave: 400 m + 4 × 50 m técnica + 200 m espalda'],
        [500, '4 × 100 m muy suaves, foco en la brazada'],
        [800, '800 m continuos regenerativos'],
        'Recuperación',
      ),
      swimWeek(
        [1000, 'Calentamiento 300 m + 10 × 50 m técnica (agarre) + 200 m suave'],
        [1100, '10 × 100 m con 30 s de descanso'],
        [1200, '1200 m continuos'],
      ),
      swimWeek(
        [1100, 'Calentamiento 300 m + 8 × 50 m técnica + 400 m con pull buoy'],
        [1100, '5 × 200 m con 45 s de descanso'],
        [1400, '1400 m continuos'],
      ),
      swimWeek(
        [1200, 'Calentamiento 400 m + 8 × 50 m técnica + 400 m variado'],
        [1300, '12 × 100 m con 25 s de descanso'],
        [1600, '1600 m continuos a ritmo cómodo'],
      ),
      swimWeek(
        [900, 'Suave: 400 m + 6 × 50 m técnica + 200 m espalda'],
        [700, '6 × 100 m suaves'],
        [1000, '1000 m continuos regenerativos'],
        'Recuperación',
      ),
      swimWeek(
        [1200, 'Calentamiento 400 m + 10 × 50 m técnica + 300 m suave'],
        [1300, '6 × 200 m con 40 s de descanso'],
        [1800, '1800 m continuos'],
      ),
      swimWeek(
        [1300, 'Calentamiento 400 m + 8 × 50 m técnica + 500 m con pull buoy'],
        [1300, '4 × 300 m con 60 s de descanso'],
        [2000, '2000 m continuos a ritmo tranquilo'],
      ),
      swimWeek(
        [1300, 'Calentamiento 400 m + 10 × 50 m técnica + 400 m variado'],
        [1700, '8 × 200 m con 30 s de descanso'],
        [2200, '2200 m continuos'],
      ),
      swimWeek(
        [1000, 'Suave: 400 m + 6 × 50 m técnica + 300 m espalda'],
        [600, '5 × 100 m suaves, técnica prolija'],
        [1200, '1200 m continuos regenerativos'],
        'Recuperación',
      ),
      swimWeek(
        [1400, 'Calentamiento 400 m + 10 × 50 m técnica + 500 m suave'],
        [1300, '3 × 400 m con 60 s de descanso, ritmo objetivo'],
        [2400, '2400 m continuos'],
      ),
      swimWeek(
        [1400, 'Calentamiento 400 m + 8 × 50 m técnica + 600 m con pull buoy'],
        [1300, '2 × 600 m con 90 s de descanso, ritmo objetivo'],
        [2600, '2600 m continuos a ritmo cómodo'],
      ),
      swimWeek(
        [1300, 'Calentamiento 400 m + 10 × 50 m técnica + 400 m suave'],
        [1000, '4 × 200 m a ritmo de test con 45 s de descanso'],
        [2000, '2000 m continuos, últimos 500 m a ritmo de test'],
      ),
      swimWeek(
        [800, 'Todo suave: 400 m + 4 × 50 m técnica + 200 m relajado'],
        [400, 'Activación: 4 × 50 m progresivos con descanso completo'],
        [1500, 'TEST: 1500 m continuos. ¡A romperla! 🏁'],
        'Semana de prueba',
      ),
    ],
  },
  {
    id: 'swim-6w-iniciacion',
    name: 'Natación · 6 semanas de iniciación',
    sport: 'Natación',
    goal: 'Nadar 400 m sin parar',
    summary:
      '2 sesiones por semana, de 25 m con pausas a 400 m continuos. Ideal si estás arrancando.',
    sessionsPerWeek: 2,
    defaultDays: [1, 4], // Mar / Vie
    weeks: [
      {
        sessions: [
          swim('Adaptación', 300, '12 × 25 m con el descanso que necesites'),
          swim('Adaptación', 400, '8 × 50 m con 45 s de descanso'),
        ],
      },
      {
        sessions: [
          swim('Técnica', 400, '4 × 50 m patada + 8 × 25 m respiración cada 3 brazadas'),
          swim('Continuidad', 500, '5 × 100 m con 60 s de descanso'),
        ],
      },
      {
        sessions: [
          swim('Técnica', 500, '6 × 50 m técnica + 4 × 50 m nado completo'),
          swim('Continuidad', 600, '4 × 150 m con 60 s de descanso'),
        ],
      },
      {
        sessions: [
          swim('Técnica', 500, '8 × 25 m técnica + 300 m variado suave'),
          swim('Continuidad', 600, '3 × 200 m con 60 s de descanso'),
        ],
      },
      {
        sessions: [
          swim('Ritmo', 600, '6 × 100 m con 45 s de descanso, ritmo parejo'),
          swim('Continuidad', 600, '2 × 300 m con 90 s de descanso'),
        ],
      },
      {
        focus: 'Semana de prueba',
        sessions: [
          swim('Activación', 400, 'Suave: 200 m + 4 × 50 m progresivos'),
          swim('Test', 400, 'TEST: 400 m continuos, a tu ritmo 🏁'),
        ],
      },
    ],
  },
  {
    id: 'run-8w-5k',
    name: 'Running · 5K en 8 semanas',
    sport: 'Running',
    goal: 'Correr 5 km sin parar',
    summary:
      '3 salidas por semana: rodaje suave, intervalos y tirada larga progresiva.',
    sessionsPerWeek: 3,
    defaultDays: [1, 3, 6], // Mar / Jue / Dom
    weeks: [
      {
        sessions: [
          run('Rodaje suave', 'Trote suave, caminá si lo necesitás', { durationSec: 20 * 60 }),
          run('Intervalos', '8 × (1 min trote + 90 s caminata)', { durationSec: 20 * 60 }),
          run('Tirada larga', 'Trote continuo muy tranquilo', { distanceM: 2500 }),
        ],
      },
      {
        sessions: [
          run('Rodaje suave', 'Trote suave y conversacional', { durationSec: 22 * 60 }),
          run('Intervalos', '6 × (2 min trote + 90 s caminata)', { durationSec: 24 * 60 }),
          run('Tirada larga', 'Trote continuo tranquilo', { distanceM: 3000 }),
        ],
      },
      {
        sessions: [
          run('Rodaje suave', 'Trote suave', { durationSec: 25 * 60 }),
          run('Intervalos', '5 × (3 min trote + 90 s caminata)', { durationSec: 25 * 60 }),
          run('Tirada larga', 'Trote continuo', { distanceM: 3500 }),
        ],
      },
      {
        focus: 'Recuperación',
        sessions: [
          run('Rodaje suave', 'Muy suave, es semana de descarga', { durationSec: 20 * 60 }),
          run('Intervalos', '4 × (2 min trote + 2 min caminata)', { durationSec: 18 * 60 }),
          run('Tirada larga', 'Trote muy tranquilo', { distanceM: 3000 }),
        ],
      },
      {
        sessions: [
          run('Rodaje suave', 'Trote suave', { durationSec: 28 * 60 }),
          run('Intervalos', '4 × (5 min trote + 90 s caminata)', { durationSec: 28 * 60 }),
          run('Tirada larga', 'Trote continuo', { distanceM: 4000 }),
        ],
      },
      {
        sessions: [
          run('Rodaje suave', 'Trote suave', { durationSec: 30 * 60 }),
          run('Intervalos', '3 × (8 min trote + 2 min caminata)', { durationSec: 32 * 60 }),
          run('Tirada larga', 'Trote continuo tranquilo', { distanceM: 4500 }),
        ],
      },
      {
        sessions: [
          run('Rodaje suave', 'Trote suave', { durationSec: 30 * 60 }),
          run('Rodaje continuo', '25 min de trote sin pausas', { durationSec: 25 * 60 }),
          run('Tirada larga', 'Casi la distancia objetivo, tranquilo', { distanceM: 5000 }),
        ],
      },
      {
        focus: 'Semana de prueba',
        sessions: [
          run('Rodaje suave', 'Trote corto y suave', { durationSec: 20 * 60 }),
          run('Activación', '10 min trote + 4 rectas de 20 s', { durationSec: 15 * 60 }),
          run('Test 5K', 'TEST: 5 km continuos, a tu ritmo 🏁', { distanceM: 5000 }),
        ],
      },
    ],
  },
];

/**
 * Genera las sesiones con fecha para un programa: semana 1 = la semana del
 * lunes de `start`; cada sesión i de la semana cae en `days[i]` (dow local,
 * 0=lunes). Las fechas anteriores a `start` se saltean (empezar un miércoles
 * no programa sesiones en el pasado).
 */
export function buildProgramSessions(
  template: ProgramTemplate,
  start: Date,
  days: number[],
): ScheduledSessionInput[] {
  const monday = mondayOf(start);
  const from = startOfDay(start).getTime();
  const sorted = [...days].sort((a, b) => a - b);
  const out: ScheduledSessionInput[] = [];
  template.weeks.forEach((week, w) => {
    week.sessions.forEach((s, i) => {
      const dow = sorted[i % sorted.length];
      // setDate y no suma de ms: inmune a los cambios de horario en 16 semanas
      const date = new Date(monday);
      date.setDate(date.getDate() + w * 7 + dow);
      if (date.getTime() < from) return;
      const focus = week.focus ? ` · ${week.focus}` : '';
      out.push({
        date: toDayStr(date),
        kind: 'ACTIVITY',
        activityType: s.type,
        targetDistanceM: s.distanceM ?? null,
        targetDurationSec: s.durationSec ?? null,
        note: `Semana ${w + 1}/${template.weeks.length}${focus} · ${s.title}: ${s.note}`,
      });
    });
  });
  return out;
}
