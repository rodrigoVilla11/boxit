import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Exercise } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import {
  ExerciseHistoryPoint,
  ExercisesService,
  PreviousSession,
} from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // Librería pública
  @Get()
  findAll(): Promise<Exercise[]> {
    return this.exercisesService.findAll();
  }

  // "Anterior" del usuario para este ejercicio (requiere sesión)
  @Get(':id/previous')
  @UseGuards(JwtAuthGuard)
  previous(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<PreviousSession | null> {
    return this.exercisesService.previousSession(user.id, id);
  }

  // Progresión del ejercicio en el tiempo (requiere sesión)
  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  history(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ExerciseHistoryPoint[]> {
    return this.exercisesService.history(user.id, id);
  }
}
