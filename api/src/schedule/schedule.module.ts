import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScheduleController } from './schedule.controller';
import { ProgramsController } from './programs.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard
  controllers: [ScheduleController, ProgramsController],
  providers: [ScheduleService],
})
// "Training" en el nombre para no chocar con el ScheduleModule de @nestjs/schedule
export class TrainingScheduleModule {}
