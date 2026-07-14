import { Controller, Get } from '@nestjs/common';
import { Exercise } from '@prisma/client';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findAll(): Promise<Exercise[]> {
    return this.exercisesService.findAll();
  }
}
