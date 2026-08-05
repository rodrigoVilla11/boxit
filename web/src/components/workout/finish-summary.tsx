'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnit } from '@/components/unit-provider';
import { useToast } from '@/components/toast-provider';
import { formatDuration, formatSessionDate } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { shareWorkoutImage } from '@/lib/share-image';
import { updateWorkout, type Workout } from '@/lib/workouts';

export function FinishSummary({
  workout,
  onClose,
}: {
  workout: Workout;
  onClose: () => void;
}) {
  const { unit } = useUnit();
  const toast = useToast();
  const [title, setTitle] = useState(workout.title ?? '');
  const [note, setNote] = useState(workout.note ?? '');
  const [sharing, setSharing] = useState(false);

  async function onShare() {
    if (sharing) return;
    setSharing(true);
    try {
      await shareWorkoutImage({
        title: title.trim() || null,
        dateText: formatSessionDate(workout.finishedAt),
        durationText: formatDuration(workout.durationSec),
        volumeText: formatVolume(workout.totalVolume, unit),
        sets: workout.totalSets,
      });
    } catch {
      // el usuario canceló o el navegador no soporta compartir/descargar
    } finally {
      setSharing(false);
    }
  }

  // El entreno ya está terminado: guardamos con un PATCH directo (best-effort).
  const save = async (patch: { title?: string | null; note?: string | null }) => {
    try {
      await updateWorkout(workout.id, patch);
    } catch {
      toast.error('No pudimos guardar la nota.');
    }
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center px-6 pb-safe pt-safe text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 ring-1 ring-primary/30">
        <CheckCircle2 className="h-9 w-9 text-primary" />
      </div>
      <h1 className="font-display text-2xl font-bold text-text">¡Entreno terminado!</h1>
      <p className="mt-1 text-sm text-textMuted">Buen laburo. Así quedó:</p>

      <div className="mt-8 grid w-full grid-cols-3 gap-2">
        <Stat label="Duración" value={formatDuration(workout.durationSec)} />
        <Stat label="Volumen" value={formatVolume(workout.totalVolume, unit)} />
        <Stat label="Series" value={String(workout.totalSets)} />
      </div>

      <div className="mt-6 w-full space-y-2 text-left">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            if (t !== (workout.title ?? '')) save({ title: t || null });
          }}
          placeholder="Nombre de la sesión (opcional)"
          maxLength={80}
          aria-label="Nombre de la sesión"
          className="h-11 w-full rounded-xl bg-surface px-3 text-sm font-semibold text-text outline-none placeholder:font-normal placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            const t = note.trim();
            if (t !== (workout.note ?? '')) save({ note: t || null });
          }}
          placeholder="¿Cómo salió? Una nota para tu yo del futuro…"
          maxLength={500}
          rows={3}
          aria-label="Nota de la sesión"
          className="w-full resize-none rounded-xl bg-surface px-3 py-2.5 text-sm text-text outline-none placeholder:text-textMuted/70 focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-6 w-full space-y-2">
        <button
          type="button"
          onClick={onShare}
          disabled={sharing}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface font-semibold text-text ring-1 ring-white/10 transition hover:bg-surfaceRaised active:scale-[0.98] disabled:opacity-60"
        >
          {sharing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Share2 className="h-5 w-5 text-primary" />
          )}
          Compartir
        </button>
        <Button onClick={onClose}>Listo</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3 shadow-card">
      <p className="text-[10px] uppercase tracking-wider text-textMuted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular-nums text-accentLime">
        {value}
      </p>
    </div>
  );
}
