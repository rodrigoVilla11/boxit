import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ActivityType } from '@prisma/client';
// Un intervalo de plantilla tiene exactamente la misma forma que el de una
// actividad registrada (reps × distancia|tiempo + descanso): reusamos el DTO.
import { ActivityIntervalInput } from '../../activities/dto/activity-interval.input';

export class CreateCardioRoutineDto {
  @IsString()
  @MinLength(1, { message: 'Poné un nombre a la plantilla.' })
  @MaxLength(60)
  name!: string;

  @IsEnum(ActivityType, { message: 'Tipo de actividad inválido.' })
  type!: ActivityType;

  // objetivos totales (opcionales): "30 min", "5 km", o ambos
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  targetDistanceM?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  targetDurationSec?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityIntervalInput)
  intervals?: ActivityIntervalInput[];
}
