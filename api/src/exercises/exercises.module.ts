import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard para la ruta /:id/previous
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
