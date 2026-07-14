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
}
