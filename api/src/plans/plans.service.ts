import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanItemInput } from './dto/plan-item.input';

const fullPlanInclude = {
  items: {
    orderBy: [{ dayOfWeek: 'asc' }, { order: 'asc' }],
    include: { routine: { select: { id: true, name: true } } },
  },
} satisfies Prisma.WeeklyPlanInclude;

export type FullPlan = Prisma.WeeklyPlanGetPayload<{
  include: typeof fullPlanInclude;
}>;

/**
 * Mapea los ítems del DTO a filas: order por-día (índice dentro del día + 1) y
 * normaliza a null los campos que no correspondan al `kind` (defensa en profundidad).
 */
function toPlanItemRows(items: PlanItemInput[]) {
  const perDay = new Map<number, number>();
  return items.map((it) => {
    const order = (perDay.get(it.dayOfWeek) ?? 0) + 1;
    perDay.set(it.dayOfWeek, order);
    const isRoutine = it.kind === 'ROUTINE';
    const isActivity = it.kind === 'ACTIVITY';
    return {
      dayOfWeek: it.dayOfWeek,
      order,
      kind: it.kind,
      routineId: isRoutine ? it.routineId ?? null : null,
      activityType: isActivity ? it.activityType ?? null : null,
      targetDistanceM: isActivity ? it.targetDistanceM ?? null : null,
      targetDurationSec: isActivity ? it.targetDurationSec ?? null : null,
      note: it.note?.trim() || null,
    };
  });
}

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePlanDto): Promise<FullPlan> {
    await this.assertRoutinesExist(userId, dto.items);
    // el primer plan del usuario queda activo automáticamente
    const count = await this.prisma.weeklyPlan.count({ where: { userId } });
    return this.prisma.weeklyPlan.create({
      data: {
        userId,
        name: dto.name.trim(),
        active: count === 0,
        items: { create: toPlanItemRows(dto.items) },
      },
      include: fullPlanInclude,
    });
  }

  list(userId: string): Promise<FullPlan[]> {
    return this.prisma.weeklyPlan.findMany({
      where: { userId },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      include: fullPlanInclude,
    });
  }

  async getOne(userId: string, id: string): Promise<FullPlan> {
    const plan = await this.prisma.weeklyPlan.findUnique({
      where: { id },
      include: fullPlanInclude,
    });
    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Plan no encontrado.');
    }
    return plan;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePlanDto,
  ): Promise<FullPlan> {
    await this.getOne(userId, id); // ownership (404)
    if (dto.items) await this.assertRoutinesExist(userId, dto.items);
    return this.prisma.weeklyPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.items !== undefined
          ? { items: { deleteMany: {}, create: toPlanItemRows(dto.items) } }
          : {}),
      },
      include: fullPlanInclude,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOne(userId, id);
    await this.prisma.weeklyPlan.delete({ where: { id } });
  }

  /** Activa un plan y desactiva el resto (un activo por vez). */
  async activate(userId: string, id: string): Promise<FullPlan> {
    await this.getOne(userId, id);
    await this.prisma.$transaction([
      this.prisma.weeklyPlan.updateMany({
        where: { userId, active: true },
        data: { active: false },
      }),
      this.prisma.weeklyPlan.update({ where: { id }, data: { active: true } }),
    ]);
    return this.getOne(userId, id);
  }

  /** Las rutinas referenciadas deben existir y ser del usuario (rutinas privadas). */
  private async assertRoutinesExist(
    userId: string,
    items: PlanItemInput[],
  ): Promise<void> {
    const ids = [
      ...new Set(
        items
          .filter((i) => i.kind === 'ROUTINE' && i.routineId)
          .map((i) => i.routineId as string),
      ),
    ];
    if (ids.length === 0) return;
    const count = await this.prisma.routine.count({
      where: { id: { in: ids }, userId },
    });
    if (count !== ids.length) {
      throw new BadRequestException('Alguna rutina del plan no existe.');
    }
  }
}
