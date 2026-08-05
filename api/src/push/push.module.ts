import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService], // el cron de recordatorios (B3) lo usa
})
export class PushModule {}
