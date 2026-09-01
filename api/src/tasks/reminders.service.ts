import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /**
   * Cada hora: a los usuarios con recordatorios activos cuya hora local coincide
   * con `reminderHour`, les manda el "hoy toca" de su plan activo.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runHourly(): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { reminderEnabled: true },
      select: { id: true, reminderHour: true, timezoneOffsetMin: true },
    });
    const now = Date.now();
    for (const u of users) {
      if (this.localHour(now, u.timezoneOffsetMin) === u.reminderHour) {
        await this.sendDailyReminder(u.id, now).catch((e) =>
          this.logger.warn(`recordatorio ${u.id}: ${String(e)}`),
        );
      }
    }
  }

  /**
   * El recordatorio del día: si hay plan para hoy manda "hoy toca"; si no,
   * y el usuario lleva demasiados días sin entrenar, manda el aviso de
   * inactividad. Devuelve qué se mandó.
   */
  async sendDailyReminder(
    userId: string,
    nowMs = Date.now(),
  ): Promise<{ kind: 'plan' | 'inactivity' | 'none'; sent: number; message: string | null }> {
    const plan = await this.sendTodayReminder(userId, nowMs);
    if (plan.message) return { kind: 'plan', ...plan };
    const inact = await this.sendInactivityReminder(userId, nowMs);
    if (inact.message) return { kind: 'inactivity', ...inact };
    return { kind: 'none', sent: 0, message: null };
  }

  /**
   * Aviso si el usuario lleva ≥ inactivityReminderDays sin ningún entreno ni
   * actividad. Null si no lo tiene configurado o si entrenó hace poco.
   */
  async sendInactivityReminder(
    userId: string,
    nowMs = Date.now(),
  ): Promise<{ sent: number; message: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { inactivityReminderDays: true },
    });
    const days = user?.inactivityReminderDays;
    if (!days) return { sent: 0, message: null };

    const [lastW, lastA] = await Promise.all([
      this.prisma.workout.findFirst({
        where: { userId, finishedAt: { not: null } },
        orderBy: { finishedAt: 'desc' },
        select: { finishedAt: true },
      }),
      this.prisma.activity.findFirst({
        where: { userId },
        orderBy: { performedAt: 'desc' },
        select: { performedAt: true },
      }),
    ]);
    const last = Math.max(
      lastW?.finishedAt?.getTime() ?? 0,
      lastA?.performedAt?.getTime() ?? 0,
    );
    const daysSince = last === 0 ? Infinity : (nowMs - last) / 86_400_000;
    if (daysSince < days) return { sent: 0, message: null };

    const message =
      last === 0
        ? 'Todavía no registraste ningún entreno. ¿Arrancamos hoy?'
        : `Hace ${Math.floor(daysSince)} días que no entrenás. ¡Dale que podés! 💪`;
    const sent = await this.push.sendToUser(userId, {
      title: 'BOX iT',
      body: message,
      url: '/entreno',
    });
    return { sent, message };
  }

  /**
   * "Hoy toca …": junta el plan semanal activo y las sesiones del calendario
   * programadas para hoy. Devuelve el mensaje y cuántos push salieron.
   */
  async sendTodayReminder(
    userId: string,
    nowMs = Date.now(),
  ): Promise<{ sent: number; message: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezoneOffsetMin: true },
    });
    const offsetMin = user?.timezoneOffsetMin ?? null;
    const plan = await this.prisma.weeklyPlan.findFirst({
      where: { userId, active: true },
      include: {
        items: {
          include: {
            routine: { select: { name: true } },
            cardioRoutine: { select: { name: true } },
          },
        },
      },
    });

    const dow = this.localDow(nowMs, offsetMin);
    const allItems = (plan?.items ?? []).filter(
      (i) => i.dayOfWeek === dow && i.kind !== 'REST',
    );

    // sesiones del calendario del día local (guardadas a mediodía UTC)
    const sessions = await this.prisma.scheduledSession.findMany({
      where: {
        userId,
        date: new Date(`${this.localDayStr(nowMs, offsetMin)}T12:00:00.000Z`),
        kind: { not: 'REST' },
      },
      orderBy: { order: 'asc' },
      include: {
        routine: { select: { name: true } },
        cardioRoutine: { select: { name: true } },
      },
    });

    // Aplicar el plan al calendario materializa sus ítems como sesiones: si la
    // sesión de hoy ya cubre un ítem del plan, no se lo nombra dos veces.
    const items = allItems.filter(
      (i) =>
        !sessions.some((s) =>
          i.kind === 'ROUTINE'
            ? s.routineId !== null && s.routineId === i.routineId
            : i.cardioRoutineId
              ? s.cardioRoutineId === i.cardioRoutineId
              : s.kind === 'ACTIVITY' && s.activityType === i.activityType,
        ),
    );
    if (items.length === 0 && sessions.length === 0) {
      return { sent: 0, message: null };
    }

    const names = [...items, ...sessions]
      .map((i) =>
        i.kind === 'ROUTINE'
          ? i.routine?.name ?? 'Rutina'
          : i.cardioRoutine?.name ?? 'Cardio',
      )
      .join(' + ');
    const message = `Hoy toca: ${names}`;
    const sent = await this.push.sendToUser(userId, {
      title: 'BOX iT — ¡A entrenar! 💪',
      body: message,
      url: '/entreno',
    });
    return { sent, message };
  }

  /** Hora local (0-23) según el offset del navegador; cae a la del server si no hay. */
  private localHour(nowMs: number, offsetMin: number | null): number {
    if (offsetMin == null) return new Date(nowMs).getHours();
    return new Date(nowMs - offsetMin * 60_000).getUTCHours();
  }

  /** Día de la semana local, 0 = lunes .. 6 = domingo (convención del plan). */
  private localDow(nowMs: number, offsetMin: number | null): number {
    if (offsetMin == null) return (new Date(nowMs).getDay() + 6) % 7;
    return (new Date(nowMs - offsetMin * 60_000).getUTCDay() + 6) % 7;
  }

  /** Día local YYYY-MM-DD según el offset (para buscar en el calendario). */
  private localDayStr(nowMs: number, offsetMin: number | null): string {
    const d =
      offsetMin == null ? new Date(nowMs) : new Date(nowMs - offsetMin * 60_000);
    if (offsetMin == null) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return d.toISOString().slice(0, 10);
  }
}
