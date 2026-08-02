'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Dumbbell,
  History,
  Loader2,
  Plus,
  Settings,
  Timer,
  Trophy,
} from 'lucide-react';
import { formatDuration, formatSessionDate } from '@/lib/format';
import { formatVolume, formatWeight } from '@/lib/units';
import { plural } from '@/lib/plural';
import {
  activityIcon,
  activityLabel,
  formatDistance,
  formatPace,
} from '@/lib/activity';
import { useUnit } from '@/components/unit-provider';
import { ErrorState } from '@/components/ui/error-state';
import { ActivityForm } from '@/components/activity/activity-form';
import {
  getHistory,
  getPersonalRecords,
  type PersonalRecord,
  type WorkoutSummary,
} from '@/lib/workouts';
import { getActivities, type Activity } from '@/lib/activities';

type FeedItem =
  | { kind: 'workout'; at: number; w: WorkoutSummary }
  | { kind: 'activity'; at: number; a: Activity };

export default function HistorialPage() {
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [error, setError] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setWorkouts(null);
    setActivities(null);
    Promise.all([getHistory(), getActivities()])
      .then(([h, a]) => {
        setWorkouts(h);
        setActivities(a);
      })
      .catch(() => setError(true));
    getPersonalRecords()
      .then(setPrs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const feed = useMemo<FeedItem[]>(() => {
    if (!workouts || !activities) return [];
    const items: FeedItem[] = [
      ...workouts.map((w) => ({
        kind: 'workout' as const,
        at: new Date(w.finishedAt ?? w.startedAt).getTime(),
        w,
      })),
      ...activities.map((a) => ({
        kind: 'activity' as const,
        at: new Date(a.performedAt).getTime(),
        a,
      })),
    ];
    return items.sort((x, y) => y.at - x.at);
  }, [workouts, activities]);

  const loading = workouts === null || activities === null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Historial</h1>
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            aria-label="Registrar actividad"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-ink transition hover:bg-primary-deep active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Actividad
          </button>
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {error ? (
        <ErrorState message="No pudimos cargar tu historial." onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-16 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : feed.length === 0 ? (
        <EmptyState onActivity={() => setActivityOpen(true)} />
      ) : (
        <div className="mt-5 space-y-6">
          {prs.length > 0 && <RecordsSection prs={prs} />}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-textMuted">
              {plural(feed.length, 'sesión', 'sesiones')}
            </h2>
            {feed.map((item) =>
              item.kind === 'workout' ? (
                <SessionCard key={`w-${item.w.id}`} workout={item.w} />
              ) : (
                <ActivityCard key={`a-${item.a.id}`} activity={item.a} />
              ),
            )}
          </section>
        </div>
      )}

      {activityOpen && (
        <ActivityForm
          initial={null}
          onClose={() => setActivityOpen(false)}
          onSaved={() => {
            setActivityOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function RecordsSection({ prs }: { prs: PersonalRecord[] }) {
  const { unit } = useUnit();
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accentLime" />
        <h2 className="text-sm font-semibold text-text">Récords</h2>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {prs.map((pr) => (
          <div
            key={pr.exerciseId}
            className="min-w-[9.5rem] shrink-0 rounded-2xl border border-accentLime/25 bg-surface p-3"
          >
            <p className="truncate text-xs text-textMuted">{pr.exerciseName}</p>
            <p className="mt-1 font-display text-lg font-bold text-accentLime">
              {pr.metric === 'weight' ? formatWeight(pr.weight, unit) : `${pr.reps} reps`}
            </p>
            <p className="text-[11px] text-textMuted">
              {pr.metric === 'weight' ? `${pr.reps} reps` : 'peso corporal'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionCard({ workout }: { workout: WorkoutSummary }) {
  const { unit } = useUnit();
  const preview = workout.exercises.map((e) => e.exercise.name).join(' · ');
  return (
    <Link
      href={`/historial/${workout.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card transition active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-text">
          {formatSessionDate(workout.finishedAt)}
        </p>
        <p className="mt-0.5 line-clamp-1 text-sm text-textMuted">
          {preview || 'Sin ejercicios'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted">
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" />
            {formatVolume(workout.totalVolume, unit)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {formatDuration(workout.durationSec)}
          </span>
          <span>{plural(workout.totalSets, 'serie', 'series')}</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-textMuted" />
    </Link>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const Icon = activityIcon(activity.type);
  const dist = formatDistance(activity.distanceM, activity.type);
  const pace = formatPace(activity.distanceM, activity.durationSec, activity.type);
  return (
    <Link
      href={`/actividad/${activity.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card transition active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-text">
          {activity.label?.trim() || activityLabel(activity.type)}
        </p>
        <p className="mt-0.5 text-sm text-textMuted">
          {formatSessionDate(activity.performedAt)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted">
          {dist && <span className="font-semibold text-text">{dist}</span>}
          {activity.durationSec > 0 && (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              {formatDuration(activity.durationSec)}
            </span>
          )}
          {pace && <span>{pace}</span>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-textMuted" />
    </Link>
  );
}

function EmptyState({ onActivity }: { onActivity: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-textMuted">
        <History className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-text">Todavía no registraste nada</p>
      <p className="mt-1 max-w-[16rem] text-sm text-textMuted">
        Terminá un entreno o registrá una actividad y va a aparecer acá.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href="/entreno"
          className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-ink transition hover:bg-primary-deep active:scale-95"
        >
          <Dumbbell className="h-5 w-5" />
          Ir a entrenar
        </Link>
        <button
          type="button"
          onClick={onActivity}
          className="flex h-11 items-center gap-2 rounded-2xl bg-surfaceRaised px-5 font-semibold text-text transition hover:bg-white/5 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Actividad
        </button>
      </div>
    </div>
  );
}
