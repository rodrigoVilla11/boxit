import { IsString, MinLength } from 'class-validator';

export class AddExerciseDto {
  @IsString()
  @MinLength(1, { message: 'Falta el ejercicio.' })
  exerciseId!: string;
}
