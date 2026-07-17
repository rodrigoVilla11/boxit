'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CalendarHeatmap } from '@/components/progress/calendar-heatmap';
import { LifetimeStats } from '@/components/progress/lifetime-stats';
import { MuscleMap } from '@/components/progress/muscle-map';
import { BodyweightChart } from '@/components/progress/bodyweight-chart';
import { VolumeChart, type VolumePoint } from '@/components/progress/volume-chart';
import { ErrorState } from '@/components/ui/error-state';
import {
  ExerciseProgress,
  type ExerciseOption,
} from '@/components/progress/exercise-progress';
import { getHistory } from '@/lib/workouts';

export default function ProgresoPage() {
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(() => {
    setStatus('loading');
    getHistory()
      .then((h) => {
        setVolume(
          [...h]
            .reverse()
            .map((w) => ({ id: w.id, date: w.finishedAt, volume: w.totalVolume })),
        );
        // dropdown de progresión: todos los ejercicios entrenados (no sólo con PR)
        const seen = new Map<string, string>();
        for (const w of h) {
          for (const we of w.exercises) {
            if (!seen.has(we.exerciseId)) seen.set(we.exerciseId, we.exercise.name);
          }
        }
        setExercises(
          [...seen.entries()]
            .map(([exerciseId, exerciseName]) => ({ exerciseId, exerciseName }))
            .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName, 'es')),
        );
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Progreso</h1>
      </header>

      {status === 'error' ? (
        <ErrorState message="No pudimos cargar tu progreso." onRetry={load} />
      ) : status === 'loading' ? (
        <div className="flex justify-center py-16 text-textMuted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <CalendarHeatmap />
          <LifetimeStats />
          <MuscleMap />
          <BodyweightChart />
          <VolumeChart points={volume} />
          {exercises.length > 0 && <ExerciseProgress exercises={exercises} />}
        </div>
      )}
    </div>
  );
}
