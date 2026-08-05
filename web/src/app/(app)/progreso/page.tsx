'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Trophy } from 'lucide-react';
import { CalendarHeatmap } from '@/components/progress/calendar-heatmap';
import { PlanWeekProgress } from '@/components/progress/plan-week-progress';
import { LifetimeStats } from '@/components/progress/lifetime-stats';
import { MuscleMap } from '@/components/progress/muscle-map';
import { MuscleVolumeChart } from '@/components/progress/muscle-volume-chart';
import { CardioChart } from '@/components/progress/cardio-chart';
import { BodyweightChart } from '@/components/progress/bodyweight-chart';
import { VolumeChart, type VolumePoint } from '@/components/progress/volume-chart';
import { ErrorState } from '@/components/ui/error-state';
import { SettingsButton } from '@/components/nav/settings-button';
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
      <header className="flex items-center justify-between pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Progreso</h1>
        <SettingsButton className="mt-6" />
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
          <PlanWeekProgress />
          <LifetimeStats />
          <Link
            href="/progreso/records"
            className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card transition active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accentLime/15">
              <Trophy className="h-5 w-5 text-accentLime" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-text">Récords</p>
              <p className="text-xs text-textMuted">Tus máximos por ejercicio.</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-textMuted" />
          </Link>
          <MuscleMap />
          <MuscleVolumeChart />
          <CardioChart />
          <BodyweightChart />
          <VolumeChart points={volume} />
          {exercises.length > 0 && <ExerciseProgress exercises={exercises} />}
        </div>
      )}
    </div>
  );
}
