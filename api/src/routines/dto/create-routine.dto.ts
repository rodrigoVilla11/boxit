import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RoutineExerciseInput } from './routine-exercise.input';

export class CreateRoutineDto {
  @IsString()
  @MinLength(1, { message: 'Poné un nombre a la rutina.' })
  @MaxLength(60)
  name!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Agregá al menos un ejercicio.' })
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseInput)
  exercises!: RoutineExerciseInput[];
}
