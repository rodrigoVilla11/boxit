import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Exercise, Prisma, SetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

export type ExerciseWithMeta = Exercise & { editable: boolean };

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
  value: number;
  reps: number;
};

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  private withMeta(
    e: Exercise,
    userId: string,
    isAdmin: boolean,
  ): ExerciseWithMeta {
    // editable: los propios; el admin además puede editar los globales (de la app)
    const editable = e.userId === userId || (isAdmin && e.userId === null);
    return { ...e, editable };
  }

  /** Librería del usuario: ejercicios de la app (userId null) + los propios. */
  async findAll(userId: string, isAdmin: boolean): Promise<ExerciseWithMeta[]> {
    const rows = await this.prisma.exercise.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: { name: 'asc' },
    });
    return rows.map((e) => this.withMeta(e, userId, isAdmin));
  }

  async create(
    userId: string,
    isAdmin: boolean,
    dto: CreateExerciseDto,
  ): Promise<ExerciseWithMeta> {
    const name = dto.name.trim();
    const existing = await this.prisma.exercise.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException('Ya existe un ejercicio con ese nombre.');
    }
    // solo un admin puede crear ejercicios globales (para todos)
    const ownerId = dto.global && isAdmin ? null : userId;
    const created = await this.prisma.exercise.create({
      data: {
        name,
        primaryMuscle: dto.primaryMuscle,
        secondaryMuscles: dto.secondaryMuscles ?? [],
        equipment: dto.equipment,
        description: dto.description?.trim() || null,
        videoUrl: dto.videoUrl?.trim() || null,
        userId: ownerId,
      },
    });
    return this.withMeta(created, userId, isAdmin);
  }

  async update(
    userId: string,
    isAdmin: boolean,
    id: string,
    dto: CreateExerciseDto,
  ): Promise<ExerciseWithMeta> {
    const ex = await this.assertManage(userId, isAdmin, id);
    const name = dto.name.trim();
    if (name !== ex.name) {
      const dup = await this.prisma.exercise.findUnique({ where: { name } });
      if (dup) throw new ConflictException('Ya existe un ejercicio con ese nombre.');
    }
    const updated = await this.prisma.exercise.update({
      where: { id },
      data: {
        name,
        primaryMuscle: dto.primaryMuscle,
        secondaryMuscles: dto.secondaryMuscles ?? [],
        equipment: dto.equipment,
        description: dto.description?.trim() || null,
        videoUrl: dto.videoUrl?.trim() || null,
      },
    });
    return this.withMeta(updated, userId, isAdmin);
  }

  async remove(userId: string, isAdmin: boolean, id: string): Promise<void> {
    await this.assertManage(userId, isAdmin, id);
    try {
      await this.prisma.exercise.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'El ejercicio está en uso en entrenos o rutinas.',
        );
      }
      throw e;
    }
  }

  private async assertManage(
    userId: string,
    isAdmin: boolean,
    id: string,
  ): Promise<Exercise> {
    const ex = await this.prisma.exercise.findUnique({ where: { id } });
    // gestionable: los propios; el admin además puede los globales (de la app)
    const canManage =
      !!ex && (ex.userId === userId || (isAdmin && ex.userId === null));
    if (!ex || !canManage) {
      throw new NotFoundException('Ejercicio no encontrado.');
    }
    return ex;
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
    days?: number,
  ): Promise<ExerciseHistoryPoint[]> {
    const finishedAt =
      days && days > 0
        ? { gte: new Date(Date.now() - days * 86_400_000) }
        : { not: null };
    const wes = await this.prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        workout: { userId, finishedAt },
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
