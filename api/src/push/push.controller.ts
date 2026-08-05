import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { PushService } from './push.service';
import {
  CreateSubscriptionDto,
  DeleteSubscriptionDto,
} from './dto/create-subscription.dto';

@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('subscriptions')
  async count(@CurrentUser() user: AuthUser) {
    return { count: await this.push.count(user.id) };
  }

  @Post('subscriptions')
  @HttpCode(204)
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: CreateSubscriptionDto) {
    return this.push.subscribe(user.id, dto);
  }

  @Delete('subscriptions')
  @HttpCode(204)
  unsubscribe(@CurrentUser() user: AuthUser, @Body() dto: DeleteSubscriptionDto) {
    return this.push.unsubscribe(user.id, dto.endpoint);
  }

  /** Manda una notificación de prueba a los dispositivos del usuario. */
  @Post('test')
  async test(@CurrentUser() user: AuthUser) {
    const sent = await this.push.sendToUser(user.id, {
      title: 'BOX iT',
      body: '¡Notificaciones activadas! Te vamos a avisar qué toca entrenar.',
      url: '/entreno',
    });
    return { sent };
  }
}
