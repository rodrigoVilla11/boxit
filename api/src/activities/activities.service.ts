import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityIntervalInput } from './dto/activity-interval.input';

const fullInclude = {
  intervals: { orderBy: { order: 'asc' } },
} satisfies Prisma.ActivityInclude;

export type FullActivity = Prisma.ActivityGetPayload<{
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
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<FullActivity[]> {
    return this.prisma.activity.findMany({
      where: { userId },
      orderBy: { performedAt: 'desc' },
      include: fullInclude,
    });
  }

  async getOne(userId: string, id: string): Promise<FullActivity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: fullInclude,
    });
    if (!activity || activity.userId !== userId) {
      throw new NotFoundException('Actividad no encontrada.');
    }
    return activity;
  }

  async create(userId: string, dto: CreateActivityDto): Promise<FullActivity> {
    // idempotencia ante doble-envío con id del cliente
    if (dto.id) {
      const existing = await this.prisma.activity.findUnique({
        where: { id: dto.id },
        select: { userId: true },
      });
      if (existing) {
        if (existing.userId !== userId) {
          throw new NotFoundException('Actividad no encontrada.');
        }
        return this.getOne(userId, dto.id);
      }
    }
    const created = await this.prisma.activity.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        type: dto.type,
        label: dto.label?.trim() || null,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : undefined,
        durationSec: dto.durationSec ?? 0,
        distanceM: dto.distanceM ?? 0,
        note: dto.note?.trim() || null,
        intervals: { create: toIntervalRows(dto.intervals) },
      },
      include: fullInclude,
    });
    return created;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<FullActivity> {
    await this.getOne(userId, id); // ownership (404 si no es tuya)
    const data: Prisma.ActivityUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.label !== undefined) data.label = dto.label?.trim() || null;
    if (dto.performedAt !== undefined) data.performedAt = new Date(dto.performedAt);
    if (dto.durationSec !== undefined) data.durationSec = dto.durationSec;
    if (dto.distanceM !== undefined) data.distanceM = dto.distanceM;
    if (dto.note !== undefined) data.note = dto.note?.trim() || null;
    if (dto.intervals !== undefined) {
      data.intervals = { deleteMany: {}, create: toIntervalRows(dto.intervals) };
    }
    return this.prisma.activity.update({
      where: { id },
      data,
      include: fullInclude,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOne(userId, id);
    await this.prisma.activity.delete({ where: { id } });
  }
}
