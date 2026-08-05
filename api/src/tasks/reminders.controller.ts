import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';

@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  /** Fuerza el recordatorio del día (plan o inactividad) para probar la notificación. */
  @Post('test')
  test(@CurrentUser() user: AuthUser) {
    return this.reminders.sendDailyReminder(user.id);
  }
}
