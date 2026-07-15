import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import {
  ExerciseHistoryPoint,
  ExercisesService,
  ExerciseWithMeta,
  PreviousSession,
} from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // Librería del usuario (ejercicios de la app + propios)
  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<ExerciseWithMeta[]> {
    return this.exercisesService.findAll(user.id, user.isAdmin);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExerciseDto,
  ): Promise<ExerciseWithMeta> {
    return this.exercisesService.create(user.id, user.isAdmin, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateExerciseDto,
  ): Promise<ExerciseWithMeta> {
    return this.exercisesService.update(user.id, user.isAdmin, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    return this.exercisesService.remove(user.id, user.isAdmin, id);
  }

  // "Anterior" del usuario para este ejercicio
  @Get(':id/previous')
  previous(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<PreviousSession | null> {
    return this.exercisesService.previousSession(user.id, id);
  }

  // Progresión del ejercicio en el tiempo
  @Get(':id/history')
  history(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ExerciseHistoryPoint[]> {
    return this.exercisesService.history(user.id, id);
  }
}
