import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard
  controllers: [PlansController],
  providers: [PlansService],
})
export class PlansModule {}
