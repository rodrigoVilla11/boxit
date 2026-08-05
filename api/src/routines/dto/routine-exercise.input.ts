import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RoutineExerciseInput {
  @IsString()
  @MinLength(1, { message: 'Falta el ejercicio.' })
  exerciseId!: string;

  @IsInt()
  @Min(1, { message: 'Mínimo 1 serie.' })
  @Max(20, { message: 'Máximo 20 series.' })
  targetSets!: number;

  // Superserie: mismo entero = mismo grupo (opcional)
  @IsOptional()
  @IsInt()
  @Min(1)
  supersetGroup?: number | null;

  // Objetivos opcionales por serie (peso siempre en kg)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  targetReps?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  targetWeight?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  restSeconds?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;
}
