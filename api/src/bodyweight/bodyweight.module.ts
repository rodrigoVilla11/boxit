import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BodyweightController } from './bodyweight.controller';
import { BodyweightService } from './bodyweight.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard
  controllers: [BodyweightController],
  providers: [BodyweightService],
})
export class BodyweightModule {}
