import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityIntervalInput } from '../activities/dto/activity-interval.input';
import { CreateCardioRoutineDto } from './dto/create-cardio-routine.dto';

const fullInclude = {
  intervals: { orderBy: { order: 'asc' } },
} satisfies Prisma.CardioRoutineInclude;

export type FullCardioRoutine = Prisma.CardioRoutineGetPayload<{
  include: typeof fullInclude;
}>;

/** Mapea los intervalos del DTO a filas (order = índice + 1). */
function toIntervalRows(intervals?: ActivityIntervalInput[] | null) {
  return (intervals ?? []).map((iv, i) => ({
    order: i + 1,
    label: iv.label?.trim() || null,
    reps: iv.reps,
    distanceM: iv.distanceM ?? null,
    durationSec: iv.durationSec ?? null,
    restSec: iv.restSec ?? null,
  }));
}

@Injectable()
export class CardioRoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<FullCardioRoutine[]> {
    return this.prisma.cardioRoutine.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: fullInclude,
    });
  }

  async getOne(userId: string, id: string): Promise<FullCardioRoutine> {
    const routine = await this.prisma.cardioRoutine.findUnique({
      where: { id },
      include: fullInclude,
    });
    if (!routine || routine.userId !== userId) {
      throw new NotFoundException('Plantilla de cardio no encontrada.');
    }
    return routine;
  }

  create(
    userId: string,
    dto: CreateCardioRoutineDto,
  ): Promise<FullCardioRoutine> {
    return this.prisma.cardioRoutine.create({
      data: {
        userId,
        name: dto.name.trim(),
        type: dto.type,
        targetDistanceM: dto.targetDistanceM || null,
        targetDurationSec: dto.targetDurationSec || null,
        note: dto.note?.trim() || null,
        intervals: { create: toIntervalRows(dto.intervals) },
      },
      include: fullInclude,
    });
  }

  async update(
    userId: string,
    id: string,
    dto: CreateCardioRoutineDto,
  ): Promise<FullCardioRoutine> {
    await this.getOne(userId, id); // ownership (404 si no es tuya)
    return this.prisma.cardioRoutine.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        type: dto.type,
        targetDistanceM: dto.targetDistanceM || null,
        targetDurationSec: dto.targetDurationSec || null,
        note: dto.note?.trim() || null,
        // reemplaza los intervalos: borra los actuales y crea los nuevos
        intervals: { deleteMany: {}, create: toIntervalRows(dto.intervals) },
      },
      include: fullInclude,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOne(userId, id);
    // los ítems del plan que la referencian quedan con cardioRoutineId null
    // (onDelete: SetNull) conservando tipo y objetivos ya copiados.
    await this.prisma.cardioRoutine.delete({ where: { id } });
  }
}
