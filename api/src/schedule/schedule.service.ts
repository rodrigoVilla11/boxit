import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { ScheduledSessionInput } from './dto/scheduled-session.input';

const fullSessionInclude = {
  routine: { select: { id: true, name: true } },
  // la plantilla viaja completa: el día del calendario muestra los intervalos
  // y "hoy toca" siembra con ellos el formulario de actividad
  cardioRoutine: { include: { intervals: { orderBy: { order: 'asc' } } } },
  program: { select: { id: true, name: true } },
} satisfies Prisma.ScheduledSessionInclude;

export type FullSession = Prisma.ScheduledSessionGetPayload<{
  include: typeof fullSessionInclude;
}>;

export type ProgramSummary = {
  id: string;
  name: string;
  note: string | null;
  createdAt: Date;
  sessionCount: number;
  startDate: Date | null;
  endDate: Date | null;
};

type CardioTemplate = {
  type: ActivityType;
  targetDistanceM: number | null;
  targetDurationSec: number | null;
};

/** Sólo importa el día: misma convención que User.birthDate (mediodía UTC). */
function dateAtNoonUtc(day: string): Date {
  const d = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('Fecha inválida.');
  }
  return d;
}

/**
 * Mapea sesiones del DTO a filas: order por-día (índice dentro del día + 1) y
 * normaliza a null los campos que no correspondan al `kind`. Si referencia una
 * plantilla de cardio, copia tipo y objetivos (respaldo por si la borran).
 */
function toSessionRows(
  items: ScheduledSessionInput[],
  cardioById: Map<string, CardioTemplate> = new Map(),
) {
  const perDay = new Map<string, number>();
  return items.map((it) => {
    const order = (perDay.get(it.date) ?? 0) + 1;
    perDay.set(it.date, order);
    const isRoutine = it.kind === 'ROUTINE';
    const isActivity = it.kind === 'ACTIVITY';
    const template =
      isActivity && it.cardioRoutineId
        ? cardioById.get(it.cardioRoutineId)
        : undefined;
    return {
      date: dateAtNoonUtc(it.date),
      order,
      kind: it.kind,
      routineId: isRoutine ? it.routineId ?? null : null,
      cardioRoutineId: isActivity ? it.cardioRoutineId ?? null : null,
      activityType: isActivity
        ? template?.type ?? it.activityType ?? null
        : null,
      targetDistanceM: isActivity
        ? template?.targetDistanceM ?? it.targetDistanceM ?? null
        : null,
      targetDurationSec: isActivity
        ? template?.targetDurationSec ?? it.targetDurationSec ?? null
        : null,
      note: it.note?.trim() || null,
    };
  });
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------- Sesiones -------------------------

  listRange(userId: string, from: string, to: string): Promise<FullSession[]> {
    return this.prisma.scheduledSession.findMany({
      where: {
        userId,
        date: { gte: dateAtNoonUtc(from), lte: dateAtNoonUtc(to) },
      },
      orderBy: [{ date: 'asc' }, { order: 'asc' }],
      include: fullSessionInclude,
    });
  }

  async createSession(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<FullSession> {
    await this.assertRoutinesExist(userId, [dto]);
    const cardio = await this.loadCardioTemplates(userId, [dto]);
    const [row] = toSessionRows([dto], cardio);
    // al final del día (después de lo ya programado esa fecha)
    const existing = await this.prisma.scheduledSession.count({
      where: { userId, date: row.date },
    });
    return this.prisma.scheduledSession.create({
      data: { ...row, order: existing + 1, userId },
      include: fullSessionInclude,
    });
  }

  async updateSession(
    userId: string,
    id: string,
    dto: UpdateSessionDto,
  ): Promise<FullSession> {
    await this.getSession(userId, id);
    return this.prisma.scheduledSession.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: dateAtNoonUtc(dto.date) } : {}),
        ...(dto.targetDistanceM !== undefined
          ? { targetDistanceM: dto.targetDistanceM }
          : {}),
        ...(dto.targetDurationSec !== undefined
          ? { targetDurationSec: dto.targetDurationSec }
          : {}),
        ...(dto.note !== undefined ? { note: dto.note?.trim() || null } : {}),
      },
      include: fullSessionInclude,
    });
  }

  async removeSession(userId: string, id: string): Promise<void> {
    await this.getSession(userId, id);
    await this.prisma.scheduledSession.delete({ where: { id } });
  }

  private async getSession(userId: string, id: string): Promise<void> {
    const s = await this.prisma.scheduledSession.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!s || s.userId !== userId) {
      throw new NotFoundException('Sesión no encontrada.');
    }
  }

  // ------------------------- Programas ------------------------

  async listPrograms(userId: string): Promise<ProgramSummary[]> {
    const programs = await this.prisma.trainingProgram.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: { select: { date: true }, orderBy: { date: 'asc' } },
      },
    });
    return programs.map((p) => ({
      id: p.id,
      name: p.name,
      note: p.note,
      createdAt: p.createdAt,
      sessionCount: p.sessions.length,
      startDate: p.sessions[0]?.date ?? null,
      endDate: p.sessions[p.sessions.length - 1]?.date ?? null,
    }));
  }

  /** Crea el programa con TODAS sus sesiones de una (un solo nested write). */
  async createProgram(
    userId: string,
    dto: CreateProgramDto,
  ): Promise<ProgramSummary> {
    await this.assertRoutinesExist(userId, dto.sessions);
    const cardio = await this.loadCardioTemplates(userId, dto.sessions);
    const rows = toSessionRows(dto.sessions, cardio);
    const program = await this.prisma.trainingProgram.create({
      data: {
        userId,
        name: dto.name.trim(),
        note: dto.note?.trim() || null,
        sessions: { create: rows.map((r) => ({ ...r, userId })) },
      },
      include: { sessions: { select: { date: true }, orderBy: { date: 'asc' } } },
    });
    return {
      id: program.id,
      name: program.name,
      note: program.note,
      createdAt: program.createdAt,
      sessionCount: program.sessions.length,
      startDate: program.sessions[0]?.date ?? null,
      endDate: program.sessions[program.sessions.length - 1]?.date ?? null,
    };
  }

  /** Borra el programa y (cascade) todas sus sesiones del calendario. */
  async removeProgram(userId: string, id: string): Promise<void> {
    const p = await this.prisma.trainingProgram.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!p || p.userId !== userId) {
      throw new NotFoundException('Programa no encontrado.');
    }
    await this.prisma.trainingProgram.delete({ where: { id } });
  }

  // ------------------------- Helpers --------------------------

  /** Las rutinas referenciadas deben existir y ser del usuario. */
  private async assertRoutinesExist(
    userId: string,
    items: ScheduledSessionInput[],
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
      throw new BadRequestException('Alguna rutina del calendario no existe.');
    }
  }

  /** Plantillas de cardio referenciadas (valida ownership); alimenta la copia. */
  private async loadCardioTemplates(
    userId: string,
    items: ScheduledSessionInput[],
  ): Promise<Map<string, CardioTemplate>> {
    const ids = [
      ...new Set(
        items
          .filter((i) => i.kind === 'ACTIVITY' && i.cardioRoutineId)
          .map((i) => i.cardioRoutineId as string),
      ),
    ];
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.cardioRoutine.findMany({
      where: { id: { in: ids }, userId },
      select: {
        id: true,
        type: true,
        targetDistanceM: true,
        targetDurationSec: true,
      },
    });
    if (rows.length !== ids.length) {
      throw new BadRequestException('Alguna plantilla de cardio no existe.');
    }
    return new Map(rows.map(({ id, ...rest }) => [id, rest]));
  }
}
