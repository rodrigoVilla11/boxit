import {
  BadRequestException,
  ConflictException,
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

  /**
   * Devuelve el entreno activo si existe; si no, crea uno nuevo (un activo por
   * vez). Acepta un `id` del cliente (offline): si ya existe, es no-op idempotente;
   * si no, se crea con ese id (salvo que ya haya otro activo, que se devuelve).
   */
  async create(userId: string, id?: string): Promise<FullWorkout> {
    if (id) {
      const existing = await this.prisma.workout.findUnique({ where: { id } });
      if (existing) {
        if (existing.userId !== userId) {
          throw new NotFoundException('Entreno no encontrado.');
        }
        return this.findFull(id); // replay → no-op
      }
      const active = await this.prisma.workout.findFirst({
        where: { userId, finishedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (active) return this.findFull(active.id);
      const created = await this.prisma.workout.create({ data: { id, userId } });
      return this.findFull(created.id);
    }
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
        // récord: solo series de trabajo real (no calentamiento, no drop)
        type: { in: ['NORMAL', 'FAILURE'] },
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
        // volumen muscular: todo lo que sea trabajo (no calentamiento)
        type: { not: 'WARMUP' },
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

  /**
   * Repite un entreno: clona ejercicios y series (mismo peso/reps/tipo/orden)
   * en un entreno nuevo, sin completar. Respeta "un activo por vez".
   */
  async repeat(userId: string, id: string): Promise<FullWorkout> {
    const source = await this.getOne(userId, id);
    const active = await this.prisma.workout.findFirst({
      where: { userId, finishedAt: null },
    });
    if (active) {
      throw new ConflictException(
        'Ya tenés un entreno en curso. Terminalo o descartalo primero.',
      );
    }
    const created = await this.prisma.workout.create({
      data: {
        userId,
        exercises: {
          create: source.exercises.map((we) => ({
            exerciseId: we.exerciseId,
            order: we.order,
            sets: {
              create: we.sets.map((s) => ({
                order: s.order,
                type: s.type,
                weight: s.weight,
                reps: s.reps,
              })),
            },
          })),
        },
      },
    });
    return this.findFull(created.id);
  }

  async addExercise(
    userId: string,
    workoutId: string,
    dto: AddExerciseDto,
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);

    // idempotencia offline: si el WorkoutExercise ya existe, no-op
    if (dto.id) {
      const existing = await this.prisma.workoutExercise.findUnique({
        where: { id: dto.id },
        select: { workoutId: true },
      });
      if (existing) {
        if (existing.workoutId !== workoutId) {
          throw new BadRequestException('Ejercicio del entreno no encontrado.');
        }
        return this.findFull(workoutId);
      }
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
    });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado.');

    const order = await this.nextExerciseOrder(workoutId);
    await this.prisma.workoutExercise.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        workoutId,
        exerciseId: dto.exerciseId,
        order,
        // Arranca con una serie de trabajo vacía, lista para editar
        sets: {
          create: [
            {
              ...(dto.setId ? { id: dto.setId } : {}),
              order: 1,
              type: 'NORMAL',
              weight: 0,
              reps: 0,
            },
          ],
        },
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

    // idempotencia offline: si la serie ya existe, no-op
    if (dto.id) {
      const existing = await this.prisma.workoutSet.findUnique({
        where: { id: dto.id },
        select: { id: true },
      });
      if (existing) return this.findFull(workoutId);
    }

    const order = await this.nextSetOrder(workoutExerciseId);
    await this.prisma.workoutSet.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
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
    if (dto.rpe !== undefined) data.rpe = dto.rpe;
    if (dto.note !== undefined) data.note = dto.note?.trim() || null;
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

  /**
   * Reordena los ejercicios del entreno según `ids` (lista completa y ordenada).
   * Renumera en dos fases dentro de una transacción para no violar el unique
   * `[workoutId, order]`: primero a órdenes negativos temporales, luego a 1..n.
   */
  async reorderExercises(
    userId: string,
    workoutId: string,
    ids: string[],
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);
    const existing = await this.prisma.workoutExercise.findMany({
      where: { workoutId },
      select: { id: true },
    });
    this.assertSameIdSet(
      existing.map((e) => e.id),
      ids,
      'Ejercicio del entreno no encontrado.',
    );
    await this.prisma.$transaction([
      ...ids.map((id, i) =>
        this.prisma.workoutExercise.update({
          where: { id },
          data: { order: -(i + 1) },
        }),
      ),
      ...ids.map((id, i) =>
        this.prisma.workoutExercise.update({
          where: { id },
          data: { order: i + 1 },
        }),
      ),
    ]);
    return this.findFull(workoutId);
  }

  /** Reordena las series de un ejercicio del entreno (misma técnica 2 fases). */
  async reorderSets(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    ids: string[],
  ): Promise<FullWorkout> {
    await this.assertActive(userId, workoutId);
    await this.assertWorkoutExercise(workoutId, workoutExerciseId);
    const existing = await this.prisma.workoutSet.findMany({
      where: { workoutExerciseId },
      select: { id: true },
    });
    this.assertSameIdSet(
      existing.map((s) => s.id),
      ids,
      'Serie no encontrada.',
    );
    await this.prisma.$transaction([
      ...ids.map((id, i) =>
        this.prisma.workoutSet.update({
          where: { id },
          data: { order: -(i + 1) },
        }),
      ),
      ...ids.map((id, i) =>
        this.prisma.workoutSet.update({
          where: { id },
          data: { order: i + 1 },
        }),
      ),
    ]);
    return this.findFull(workoutId);
  }

  // ---- helpers de ownership / integridad ----

  /** Exige que `ids` sea exactamente el mismo conjunto que `existing` (sin duplicados). */
  private assertSameIdSet(
    existing: string[],
    ids: string[],
    message: string,
  ): void {
    const unique = new Set(ids);
    const owned = new Set(existing);
    if (
      unique.size !== ids.length ||
      ids.length !== existing.length ||
      ids.some((id) => !owned.has(id))
    ) {
      throw new BadRequestException(message);
    }
  }

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
