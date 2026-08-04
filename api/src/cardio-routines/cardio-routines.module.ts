import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CardioRoutinesController } from './cardio-routines.controller';
import { CardioRoutinesService } from './cardio-routines.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard
  controllers: [CardioRoutinesController],
  providers: [CardioRoutinesService],
})
export class CardioRoutinesModule {}
