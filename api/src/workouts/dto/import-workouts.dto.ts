import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SetType } from '@prisma/client';

class ImportSetDto {
  @IsOptional()
  @IsEnum(SetType)
  type?: SetType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rpe?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;

  @IsOptional()
  @IsInt()
  order?: number;
}

class ImportExerciseDto {
  @IsOptional()
  @IsString()
  exerciseId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsInt()
  targetReps?: number | null;

  @IsOptional()
  @IsInt()
  targetRepsMax?: number | null;

  @IsOptional()
  @IsNumber()
  targetWeight?: number | null;

  @IsOptional()
  @IsInt()
  restSeconds?: number | null;

  @IsOptional()
  @IsInt()
  supersetGroup?: number | null;

  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => ImportSetDto)
  sets!: ImportSetDto[];
}

class ImportWorkoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  finishedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ImportExerciseDto)
  exercises!: ImportExerciseDto[];
}

export class ImportWorkoutsDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ImportWorkoutDto)
  workouts!: ImportWorkoutDto[];
}
