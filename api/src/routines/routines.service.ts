import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { fullWorkoutInclude, FullWorkout } from '../workouts/workouts.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

const fullRoutineInclude = {
  exercises: {
    orderBy: { order: 'asc' },
    include: { exercise: true },
  },
} satisfies Prisma.RoutineInclude;

export type FullRoutine = Prisma.RoutineGetPayload<{
  include: typeof fullRoutineInclude;
}>;

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRoutineDto): Promise<FullRoutine> {
    await this.assertExercisesExist(dto.exercises.map((e) => e.exerciseId));
    return this.prisma.routine.create({
      data: {
        userId,
        name: dto.name.trim(),
        exercises: {
          create: dto.exercises.map((e, i) => ({
            exerciseId: e.exerciseId,
            order: i + 1,
            targetSets: e.targetSets,
          })),
        },
      },
      include: fullRoutineInclude,
    });
  }

  list(userId: string): Promise<FullRoutine[]> {
    return this.prisma.routine.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: fullRoutineInclude,
    });
  }

  async getOne(userId: string, id: string): Promise<FullRoutine> {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
      include: fullRoutineInclude,
    });
    if (!routine || routine.userId !== userId) {
      throw new NotFoundException('Rutina no encontrada.');
    }
    return routine;
  }

  async update(
    userId: string,
    id: string,
    dto: CreateRoutineDto,
  ): Promise<FullRoutine> {
    await this.getOne(userId, id); // ownership (404 si no es tuya)
    await this.assertExercisesExist(dto.exercises.map((e) => e.exerciseId));
    return this.prisma.routine.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        // reemplaza los ejercicios: borra los actuales y crea los nuevos
        exercises: {
          deleteMany: {},
          create: dto.exercises.map((e, i) => ({
            exerciseId: e.exerciseId,
            order: i + 1,
            targetSets: e.targetSets,
          })),
        },
      },
      include: fullRoutineInclude,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOne(userId, id);
    await this.prisma.routine.delete({ where: { id } });
  }

  /** Empieza un entreno pre-cargando ejercicios y series de la rutina. */
  async startWorkout(userId: string, id: string): Promise<FullWorkout> {
    const routine = await this.getOne(userId, id);

    const active = await this.prisma.workout.findFirst({
      where: { userId, finishedAt: null },
    });
    if (active) {
      throw new ConflictException(
        'Ya tenés un entreno en curso. Terminalo o descartalo primero.',
      );
    }

    return this.prisma.workout.create({
      data: {
        userId,
        exercises: {
          create: routine.exercises.map((re) => ({
            exerciseId: re.exerciseId,
            order: re.order,
            sets: {
              create: Array.from({ length: re.targetSets }, (_, i) => ({
                order: i + 1,
                type: 'NORMAL',
                weight: 0,
                reps: 0,
              })),
            },
          })),
        },
      },
      include: fullWorkoutInclude,
    });
  }

  private async assertExercisesExist(ids: string[]): Promise<void> {
    const unique = [...new Set(ids)];
    const count = await this.prisma.exercise.count({
      where: { id: { in: unique } },
    });
    if (count !== unique.length) {
      throw new BadRequestException('Alguno de los ejercicios no existe.');
    }
  }
}
