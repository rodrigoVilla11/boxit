import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class RoutineExerciseInput {
  @IsString()
  @MinLength(1, { message: 'Falta el ejercicio.' })
  exerciseId!: string;

  @IsInt()
  @Min(1, { message: 'Mínimo 1 serie.' })
  @Max(20, { message: 'Máximo 20 series.' })
  targetSets!: number;
}
