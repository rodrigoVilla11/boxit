import { Injectable } from '@nestjs/common';
import { Exercise, SetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type PreviousSet = {
  order: number;
  weight: number;
  reps: number;
  type: SetType;
};

export type PreviousSession = {
  workoutId: string;
  performedAt: Date | null;
  sets: PreviousSet[];
};

export type ExerciseHistoryPoint = {
  workoutId: string;
  date: Date | null;
  metric: 'weight' | 'reps';
  value: number; // mejor peso (kg) o mejor cantidad de reps
  reps: number;
};

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Devuelve la librería completa de ejercicios, ordenada por nombre. */
  findAll(): Promise<Exercise[]> {
    return this.prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * "Anterior": series completadas de este ejercicio en la última sesión
   * terminada del usuario. Devuelve null si nunca lo hizo.
   */
  async previousSession(
    userId: string,
    exerciseId: string,
  ): Promise<PreviousSession | null> {
    const we = await this.prisma.workoutExercise.findFirst({
      where: {
        exerciseId,
        workout: { userId, finishedAt: { not: null } },
        sets: { some: { completed: true } },
      },
      orderBy: { workout: { finishedAt: 'desc' } },
      select: {
        workout: { select: { id: true, finishedAt: true } },
        sets: {
          where: { completed: true },
          orderBy: { order: 'asc' },
          select: { order: true, weight: true, reps: true, type: true },
        },
      },
    });

    if (!we) return null;
    return {
      workoutId: we.workout.id,
      performedAt: we.workout.finishedAt,
      sets: we.sets,
    };
  }

  /**
   * Progresión del ejercicio: por cada sesión terminada, el mejor peso (o reps
   * si es peso corporal) de las series de trabajo completadas. Orden cronológico.
   */
  async history(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseHistoryPoint[]> {
    const wes = await this.prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        workout: { userId, finishedAt: { not: null } },
        sets: { some: { completed: true, type: 'NORMAL' } },
      },
      orderBy: { workout: { finishedAt: 'asc' } },
      select: {
        workout: { select: { id: true, finishedAt: true } },
        sets: {
          where: { completed: true, type: 'NORMAL' },
          select: { weight: true, reps: true },
        },
      },
    });

    return wes.map((we) => {
      const hasWeight = we.sets.some((s) => s.weight > 0);
      if (hasWeight) {
        const best = we.sets
          .filter((s) => s.weight > 0)
          .reduce((a, b) =>
            b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a,
          );
        return {
          workoutId: we.workout.id,
          date: we.workout.finishedAt,
          metric: 'weight' as const,
          value: best.weight,
          reps: best.reps,
        };
      }
      const best = we.sets.reduce((a, b) => (b.reps > a.reps ? b : a));
      return {
        workoutId: we.workout.id,
        date: we.workout.finishedAt,
        metric: 'reps' as const,
        value: best.reps,
        reps: best.reps,
      };
    });
  }
}
