import { Injectable, NotFoundException } from '@nestjs/common';
import { Bodyweight, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBodyweightDto } from './dto/create-bodyweight.dto';
import { UpdateBodyweightDto } from './dto/update-bodyweight.dto';

@Injectable()
export class BodyweightService {
  constructor(private readonly prisma: PrismaService) {}

  /** Registros del usuario, del más nuevo al más viejo. */
  list(userId: string): Promise<Bodyweight[]> {
    return this.prisma.bodyweight.findMany({
      where: { userId },
      orderBy: { takenAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateBodyweightDto): Promise<Bodyweight> {
    return this.prisma.bodyweight.create({
      data: {
        userId,
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct ?? null,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        note: dto.note?.trim() || null,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBodyweightDto,
  ): Promise<Bodyweight> {
    await this.assertOwner(userId, id);
    const data: Prisma.BodyweightUpdateInput = {};
    if (dto.weightKg !== undefined) data.weightKg = dto.weightKg;
    if (dto.bodyFatPct !== undefined) data.bodyFatPct = dto.bodyFatPct;
    if (dto.takenAt !== undefined) data.takenAt = new Date(dto.takenAt);
    if (dto.note !== undefined) data.note = dto.note?.trim() || null;
    return this.prisma.bodyweight.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwner(userId, id);
    await this.prisma.bodyweight.delete({ where: { id } });
  }

  private async assertOwner(userId: string, id: string): Promise<void> {
    const row = await this.prisma.bodyweight.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Registro no encontrado.');
    }
  }
}
