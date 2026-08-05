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
        await this.sendTodayReminder(u.id).catch((e) =>
          this.logger.warn(`recordatorio ${u.id}: ${String(e)}`),
        );
      }
    }
  }

  /** "Hoy toca …" del plan activo. Devuelve el mensaje y cuántos push salieron. */
  async sendTodayReminder(
    userId: string,
    nowMs = Date.now(),
  ): Promise<{ sent: number; message: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezoneOffsetMin: true },
    });
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
    if (!plan) return { sent: 0, message: null };

    const dow = this.localDow(nowMs, user?.timezoneOffsetMin ?? null);
    const items = plan.items.filter(
      (i) => i.dayOfWeek === dow && i.kind !== 'REST',
    );
    if (items.length === 0) return { sent: 0, message: null };

    const names = items
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
}
