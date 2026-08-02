'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { formatDuration, formatSessionDate } from '@/lib/format';
import {
  activityIcon,
  activityLabel,
  formatDistance,
  formatPace,
} from '@/lib/activity';
import { ErrorState } from '@/components/ui/error-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActivityForm } from '@/components/activity/activity-form';
import { useToast } from '@/components/toast-provider';
import {
  deleteActivity,
  getActivity,
  type Activity,
  type ActivityInterval,
} from '@/lib/activities';

export default function ActivityDetailPage() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setActivity(null);
    getActivity(id)
      .then(setActivity)
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete() {
    try {
      await deleteActivity(id);
      toast.success('Actividad borrada.');
      router.push('/historial');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar la actividad.');
      setConfirmDelete(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 pb-16 text-center">
        <ErrorState message="No pudimos cargar esta actividad." onRetry={load} />
        <button
          onClick={() => router.push('/historial')}
          className="text-sm font-semibold text-textMuted transition hover:text-text"
        >
          Volver al historial
        </button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-textMuted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const Icon = activityIcon(activity.type);
  const dist = formatDistance(activity.distanceM, activity.type);
  const pace = formatPace(activity.distanceM, activity.durationSec, activity.type);

  return (
    <div className="flex min-h-dvh flex-col pb-4">
      <header className="flex items-center gap-1 pt-safe">
        <button
          type="button"
          onClick={() => router.push('/historial')}
          aria-label="Volver"
          className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:text-text"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="mt-5 flex min-w-0 items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-primary" />
          <h1 className="truncate font-display text-xl font-bold text-text">
            {activity.label?.trim() || activityLabel(activity.type)}
          </h1>
        </div>
      </header>
      <p className="ml-10 mt-1 text-sm text-textMuted">
        {formatSessionDate(activity.performedAt)} · {activityLabel(activity.type)}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Distancia" value={dist || '—'} />
        <Metric
          label="Tiempo"
          value={activity.durationSec > 0 ? formatDuration(activity.durationSec) : '—'}
        />
        <Metric label="Ritmo" value={pace ?? '—'} />
      </div>

      {activity.intervals.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-textMuted">Intervalos</h2>
          <div className="space-y-1.5">
            {activity.intervals.map((iv) => (
              <IntervalRow key={iv.id} iv={iv} />
            ))}
          </div>
        </section>
      )}

      {activity.note?.trim() && (
        <section className="mt-4 rounded-2xl bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-textMuted">Nota</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text">{activity.note}</p>
        </section>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-semibold text-text ring-1 ring-white/10 transition hover:bg-surfaceRaised active:scale-[0.99]"
        >
          <Pencil className="h-5 w-5" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-semibold text-danger ring-1 ring-danger/20 transition hover:bg-surfaceRaised active:scale-[0.99]"
        >
          <Trash2 className="h-5 w-5" />
          Borrar
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar la actividad?"
        message="Se elimina este registro. No se puede deshacer."
        confirmLabel="Borrar"
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {editing && (
        <ActivityForm
          initial={activity}
          onClose={() => setEditing(false)}
          onSaved={(a) => {
            setEditing(false);
            setActivity(a);
          }}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-0.5 truncate font-display text-base font-semibold tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}

function IntervalRow({ iv }: { iv: ActivityInterval }) {
  const parts: string[] = [];
  if (iv.distanceM) parts.push(`${iv.distanceM.toLocaleString('es-AR')} m`);
  if (iv.durationSec) parts.push(formatDuration(iv.durationSec));
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
      <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-surfaceRaised px-1.5 text-sm font-semibold text-text">
        {iv.reps}×
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text">
          {parts.join(' · ') || iv.label || 'Intervalo'}
        </p>
        {iv.label && parts.length > 0 && (
          <p className="truncate text-xs text-textMuted">{iv.label}</p>
        )}
      </div>
      {iv.restSec ? (
        <span className="shrink-0 text-xs text-textMuted">desc {iv.restSec}s</span>
      ) : null}
    </div>
  );
}
