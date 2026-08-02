import {
  Activity as ActivityIcon,
  Bike,
  Footprints,
  PersonStanding,
  Sailboat,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityType } from './activities';

export const ACTIVITY_TYPES: ActivityType[] = [
  'RUN',
  'SWIM',
  'BIKE',
  'ROW',
  'WALK',
  'OTHER',
];

type Meta = { label: string; icon: LucideIcon; distanceUnit: 'km' | 'm' | null };

const META: Record<ActivityType, Meta> = {
  RUN: { label: 'Correr', icon: Footprints, distanceUnit: 'km' },
  SWIM: { label: 'Nadar', icon: Waves, distanceUnit: 'm' },
  BIKE: { label: 'Bici', icon: Bike, distanceUnit: 'km' },
  ROW: { label: 'Remo', icon: Sailboat, distanceUnit: 'm' },
  WALK: { label: 'Caminar', icon: PersonStanding, distanceUnit: 'km' },
  OTHER: { label: 'Otra', icon: ActivityIcon, distanceUnit: null },
};

export const activityLabel = (t: ActivityType): string => META[t].label;
export const activityIcon = (t: ActivityType): LucideIcon => META[t].icon;
/** Unidad de entrada de distancia sugerida por tipo (km para correr, m para nadar). */
export const activityDistanceUnit = (t: ActivityType): 'km' | 'm' | null =>
  META[t].distanceUnit;

const nf = (max: number) => ({ maximumFractionDigits: max });

/** Distancia formateada según el tipo (km o m), es-AR. '' si es 0. */
export function formatDistance(distanceM: number, type: ActivityType): string {
  if (!distanceM || distanceM <= 0) return '';
  const unit = META[type].distanceUnit ?? (distanceM >= 1000 ? 'km' : 'm');
  if (unit === 'km') {
    return `${(distanceM / 1000).toLocaleString('es-AR', nf(2))} km`;
  }
  return `${distanceM.toLocaleString('es-AR')} m`;
}

function paceClock(sec: number): string {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Ritmo según el tipo. null si no aplica o faltan datos.
 * correr/caminar → min/km, nadar → min/100 m, remo → /500 m, bici → km/h.
 */
export function formatPace(
  distanceM: number,
  durationSec: number,
  type: ActivityType,
): string | null {
  if (distanceM <= 0 || durationSec <= 0) return null;
  switch (type) {
    case 'RUN':
    case 'WALK':
      return `${paceClock(durationSec / (distanceM / 1000))} /km`;
    case 'SWIM':
      return `${paceClock(durationSec / (distanceM / 100))} /100 m`;
    case 'ROW':
      return `${paceClock(durationSec / (distanceM / 500))} /500 m`;
    case 'BIKE':
      return `${(distanceM / 1000 / (durationSec / 3600)).toLocaleString('es-AR', nf(1))} km/h`;
    default:
      return null;
  }
}
