'use client';

import { useEffect, useState } from 'react';
import { MuscleMap } from '@/components/progress/muscle-map';
import { VolumeChart, type VolumePoint } from '@/components/progress/volume-chart';
import {
  ExerciseProgress,
  type ExerciseOption,
} from '@/components/progress/exercise-progress';
import { getHistory, getPersonalRecords } from '@/lib/workouts';

export default function ProgresoPage() {
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);

  useEffect(() => {
    getHistory()
      .then((h) =>
        setVolume(
          [...h]
            .reverse()
            .map((w) => ({ id: w.id, date: w.finishedAt, volume: w.totalVolume })),
        ),
      )
      .catch(() => {});
    getPersonalRecords()
      .then((prs) =>
        setExercises(
          prs.map((p) => ({ exerciseId: p.exerciseId, exerciseName: p.exerciseName })),
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe">
        <h1 className="pt-6 font-display text-2xl font-bold text-text">Progreso</h1>
      </header>

      <div className="mt-4 space-y-3">
        <MuscleMap />
        <VolumeChart points={volume} />
        {exercises.length > 0 && <ExerciseProgress exercises={exercises} />}
      </div>
    </div>
  );
}
