import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Muscle, Prisma, Workout, WorkoutSet } from '@prisma/client';
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

// Resumen para el historial: ejercicios (con su info) pero sin las series.
const historyInclude = {
  exercises: { orderBy: { order: 'asc' }, include: { exercise: true } },
} satisfies Prisma.WorkoutInclude;

export type WorkoutSummary = Prisma.WorkoutGetPayload<{
  include: typeof historyInclude;
}>;

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  // 'weight' para ejercicios con carga; 'reps' para peso corporal (mejor cantidad de reps)
  metric: 'weight' | 'reps';
  weight: number;
  reps: number;
  workoutId: string;
  achievedAt: Date | null;
};

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

  /** Historial: entrenos terminados, más recientes primero. */
  list(userId: string): Promise<WorkoutSummary[]> {
    return this.prisma.workout.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: 'desc' },
      include: historyInclude,
    });
  }

  /**
   * Récords por ejercicio (series de trabajo completadas). Si el ejercicio se hizo
   * con carga, el récord es el mejor peso; si es a puro peso corporal, la mejor
   * cantidad de reps.
   */
  async personalRecords(userId: string): Promise<PersonalRecord[]> {
    const sets = await this.prisma.workoutSet.findMany({
      where: {
        completed: true,
        type: 'NORMAL',
        workoutExercise: {
          workout: { userId, finishedAt: { not: null } },
        },
      },
      select: {
        weight: true,
        reps: true,
        workoutExercise: {
          select: {
            exerciseId: true,
            exercise: { select: { name: true } },
            workout: { select: { id: true, finishedAt: true } },
          },
        },
      },
    });

    type Row = {
      weight: number;
      reps: number;
      exerciseId: string;
      name: string;
      workoutId: string;
      finishedAt: Date | null;
    };
    const groups = new Map<string, Row[]>();
    for (const s of sets) {
      const we = s.workoutExercise;
      const row: Row = {
        weight: s.weight,
        reps: s.reps,
        exerciseId: we.exerciseId,
        name: we.exercise.name,
        workoutId: we.workout.id,
        finishedAt: we.workout.finishedAt,
      };
      const list = groups.get(row.exerciseId);
      if (list) list.push(row);
      else groups.set(row.exerciseId, [row]);
    }

    const records: PersonalRecord[] = [];
    for (const [exerciseId, list] of groups) {
      const hasWeight = list.some((r) => r.weight > 0);
      let best: Row;
      let metric: 'weight' | 'reps';
      if (hasWeight) {
        metric = 'weight';
        best = list
          .filter((r) => r.weight > 0)
          .reduce((a, b) =>
            b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a,
          );
      } else {
        metric = 'reps';
        best = list.reduce((a, b) => (b.reps > a.reps ? b : a));
        if (best.reps <= 0) continue; // sin reps útiles → sin récord
      }
      records.push({
        exerciseId,
        exerciseName: best.name,
        metric,
        weight: best.weight,
        reps: best.reps,
        workoutId: best.workoutId,
        achievedAt: best.finishedAt,
      });
    }

    return records.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName, 'es'));
  }

  /**
   * Mapa de músculos: series de trabajo y volumen por músculo primario en los
   * últimos `days` días (entrenos terminados). Devuelve todos los músculos,
   * con 0 si no se entrenaron, para que el front pinte el cuerpo completo.
   */
  async muscleMap(
    userId: string,
    days = 30,
  ): Promise<{ muscle: Muscle; sets: number; score: number }[]> {
    const since = new Date(Date.now() - days * 86_400_000);
    const sets = await this.prisma.workoutSet.findMany({
      where: {
        completed: true,
        type: 'NORMAL',
        workoutExercise: {
          workout: { userId, finishedAt: { gte: since } },
        },
      },
      select: {
        workoutExercise: {
          select: {
            exercise: {
              select: { primaryMuscle: true, secondaryMuscles: true },
            },
          },
        },
      },
    });

    // sets = series donde el músculo es primario (trabajo directo)
    // score = intensidad ponderada: primario 1.0, cada secundario 0.5
    const acc = new Map<Muscle, { sets: number; score: number }>();
    const bump = (m: Muscle, sets: number, score: number) => {
      const cur = acc.get(m) ?? { sets: 0, score: 0 };
      cur.sets += sets;
      cur.score += score;
      acc.set(m, cur);
    };
    for (const s of sets) {
      const ex = s.workoutExercise.exercise;
      bump(ex.primaryMuscle, 1, 1);
      for (const sm of ex.secondaryMuscles) bump(sm, 0, 0.5);
    }

    return Object.values(Muscle).map((muscle) => ({
      muscle,
      sets: acc.get(muscle)?.sets ?? 0,
      score: Math.round((acc.get(muscle)?.score ?? 0) * 10) / 10,
    }));
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
