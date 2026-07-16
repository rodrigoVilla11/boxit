import { IsOptional, IsString, MinLength } from 'class-validator';

export class AddExerciseDto {
  @IsString()
  @MinLength(1, { message: 'Falta el ejercicio.' })
  exerciseId!: string;

  // ids generados por el cliente (logueo offline idempotente)
  @IsOptional()
  @IsString()
  id?: string; // id del WorkoutExercise

  @IsOptional()
  @IsString()
  setId?: string; // id de la serie inicial
}
