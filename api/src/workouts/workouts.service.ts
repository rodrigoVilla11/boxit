import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Workout, WorkoutSet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddExerciseDto } from './dto/add-exercise.dto';
import { AddSetDto } from './dto/add-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { computeDurationSec, computeWorkoutTotals } from './workouts.calc';

// Entreno con ejercicios (ordenados) y sus series (ordenadas).
export const fullWorkoutInclude = {
  exercises: {
    orderBy: { order: 'asc' },
    include: {
      exercise: true,
      sets: { orderBy: { order: 'asc' } },
    },
  },
} satisfies Prisma.WorkoutInclude;

export type FullWorkout = Prisma.WorkoutGetPayload<{
  include: typeof fullWorkoutInclude;
}>;

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  private findFull(id: string): Promise<FullWorkout> {
    return this.prisma.workout.findUniqueOrThrow({
      where: { id },
      include: fullWorkoutInclude,
    });
  }

  /** Devuelve el entreno activo si existe; si no, crea uno nuevo (un activo por vez). */
  async create(userId: string): Promise<FullWorkout> {
    const existing = await this.prisma.workout.findFirst({
      where: { userId, finishedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    const workout =
      existing ?? (await this.prisma.workout.create({ data: { userId } }));
    return this.findFull(workout.id);
  }

  list(userId: string): Promise<Workout[]> {
    return this.prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async active(userId: string): Promise<FullWorkout | null> {
    const workout = await this.prisma.workout.findFirst({
      where: { userId, finishedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    return workout ? this.findFull(workout.id) : null;
  }

  async getOne(userId: string, id: string): Promise<FullWorkout> {
    await this.assertOwner(userId, id);
    return this.findFull(id);
  }

  async finish(userId: string, id: string): Promise<FullWorkout> {
    const workout = await this.assertActive(userId, id);
    const full = await this.findFull(id);
    const allSets = full.exercises.flatMap((e) => e.sets);
    const finishedAt = new Date();
    const { totalVolume, totalSets } = computeWorkoutTotals(allSets);
    await this.prisma.workout.update({
      where: { id },
      data: {
        finishedAt,
        durationSec: computeDurationSec(workout.startedAt, finishedAt),
        totalVolume,
        totalSets,
      },
    });
    return this.findFull(id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwner(userId, id);
    await this.prisma.workout.delete({ where: { id } });
  }

  async addExercise(
    userId: string,
    workoutId: string,
    dto: AddExerciseDto,
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
    });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado.');

    const order = await this.nextExerciseOrder(workoutId);
    await this.prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId: dto.exerciseId,
        order,
        // Arranca con una serie de trabajo vacía, lista para editar
        sets: { create: [{ order: 1, type: 'NORMAL', weight: 0, reps: 0 }] },
      },
    });
    return this.findFull(workoutId);
  }

  async removeExercise(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);
    await this.assertWorkoutExercise(workoutId, workoutExerciseId);
    await this.prisma.workoutExercise.delete({ where: { id: workoutExerciseId } });
    return this.findFull(workoutId);
  }

  async addSet(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    dto: AddSetDto,
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);
    await this.assertWorkoutExercise(workoutId, workoutExerciseId);

    const order = await this.nextSetOrder(workoutExerciseId);
    await this.prisma.workoutSet.create({
      data: {
        workoutExerciseId,
        order,
        type: dto.type ?? 'NORMAL',
        weight: dto.weight ?? 0,
        reps: dto.reps ?? 0,
      },
    });
    return this.findFull(workoutId);
  }

  async updateSet(
    userId: string,
    workoutId: string,
    setId: string,
    dto: UpdateSetDto,
  ): Promise<WorkoutSet> {
    await this.assertActive(userId, workoutId);
    await this.assertSet(workoutId, setId);

    const data: Prisma.WorkoutSetUpdateInput = {};
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.reps !== undefined) data.reps = dto.reps;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.completed !== undefined) {
      data.completed = dto.completed;
      data.completedAt = dto.completed ? new Date() : null;
    }
    return this.prisma.workoutSet.update({ where: { id: setId }, data });
  }

  async removeSet(
    userId: string,
    workoutId: string,
    setId: string,
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);
    await this.assertSet(workoutId, setId);
    await this.prisma.workoutSet.delete({ where: { id: setId } });
    return this.findFull(workoutId);
  }

  // ---- helpers de ownership / integridad ----

  private async assertOwner(userId: string, id: string): Promise<Workout> {
    const workout = await this.prisma.workout.findUnique({ where: { id } });
    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Entreno no encontrado.');
    }
    return workout;
  }

  private async assertActive(userId: string, id: string): Promise<Workout> {
    const workout = await this.assertOwner(userId, id);
    if (workout.finishedAt) {
      throw new BadRequestException('El entreno ya está terminado.');
    }
    return workout;
  }

  private async assertWorkoutExercise(
    workoutId: string,
    workoutExerciseId: string,
  ): Promise<void> {
    const we = await this.prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      select: { workoutId: true },
    });
    if (!we || we.workoutId !== workoutId) {
      throw new NotFoundException('Ejercicio del entreno no encontrado.');
    }
  }

  private async assertSet(workoutId: string, setId: string): Promise<void> {
    const set = await this.prisma.workoutSet.findUnique({
      where: { id: setId },
      select: { workoutExercise: { select: { workoutId: true } } },
    });
    if (!set || set.workoutExercise.workoutId !== workoutId) {
      throw new NotFoundException('Serie no encontrada.');
    }
  }

  private async nextExerciseOrder(workoutId: string): Promise<number> {
    const agg = await this.prisma.workoutExercise.aggregate({
      where: { workoutId },
      _max: { order: true },
    });
    return (agg._max.order ?? 0) + 1;
  }

  private async nextSetOrder(workoutExerciseId: string): Promise<number> {
    const agg = await this.prisma.workoutSet.aggregate({
      where: { workoutExerciseId },
      _max: { order: true },
    });
    return (agg._max.order ?? 0) + 1;
  }
}
