import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';

@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  /** Fuerza el envío del "hoy toca" al usuario (para probar la notificación). */
  @Post('test')
  test(@CurrentUser() user: AuthUser) {
    return this.reminders.sendTodayReminder(user.id);
  }
}
