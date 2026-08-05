import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { WorkoutsService } from './workouts.service';
import { AddExerciseDto } from './dto/add-exercise.dto';
import { AddSetDto } from './dto/add-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { ReplaceExerciseDto } from './dto/replace-exercise.dto';
import { ReorderDto } from './dto/reorder.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';

@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkoutDto) {
    return this.workouts.create(user.id, dto.id);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.workouts.list(user.id);
  }

  // OJO: 'active' y 'prs' deben ir antes que ':id'
  @Get('active')
  active(@CurrentUser() user: AuthUser) {
    return this.workouts.active(user.id);
  }

  @Get('prs')
  prs(@CurrentUser() user: AuthUser) {
    return this.workouts.personalRecords(user.id);
  }

  @Get('muscle-map')
  muscleMap(
    @CurrentUser() user: AuthUser,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.workouts.muscleMap(user.id, days ?? 30);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workouts.getOne(user.id, id);
  }

  @Patch(':id/finish')
  finish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workouts.finish(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workouts.updateWorkout(user.id, id, dto);
  }

  @Post(':id/repeat')
  repeat(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workouts.repeat(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workouts.remove(user.id, id);
  }

  @Post(':id/exercises')
  addExercise(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddExerciseDto,
  ) {
    return this.workouts.addExercise(user.id, id, dto);
  }

  @Patch(':id/exercises/reorder')
  reorderExercises(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReorderDto,
  ) {
    return this.workouts.reorderExercises(user.id, id, dto.ids);
  }

  @Patch(':id/exercises/:workoutExerciseId/sets/reorder')
  reorderSets(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('workoutExerciseId') workoutExerciseId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.workouts.reorderSets(user.id, id, workoutExerciseId, dto.ids);
  }

  @Delete(':id/exercises/:workoutExerciseId')
  removeExercise(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('workoutExerciseId') workoutExerciseId: string,
  ) {
    return this.workouts.removeExercise(user.id, id, workoutExerciseId);
  }

  @Patch(':id/exercises/:workoutExerciseId/replace')
  replaceExercise(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('workoutExerciseId') workoutExerciseId: string,
    @Body() dto: ReplaceExerciseDto,
  ) {
    return this.workouts.replaceExercise(user.id, id, workoutExerciseId, dto);
  }

  @Post(':id/exercises/:workoutExerciseId/sets')
  addSet(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('workoutExerciseId') workoutExerciseId: string,
    @Body() dto: AddSetDto,
  ) {
    return this.workouts.addSet(user.id, id, workoutExerciseId, dto);
  }

  @Patch(':id/sets/:setId')
  updateSet(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('setId') setId: string,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workouts.updateSet(user.id, id, setId, dto);
  }

  @Delete(':id/sets/:setId')
  removeSet(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('setId') setId: string,
  ) {
    return this.workouts.removeSet(user.id, id, setId);
  }
}
