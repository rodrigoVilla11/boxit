import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ActivityType } from '@prisma/client';
import { ActivityIntervalInput } from './activity-interval.input';

export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Tipo de actividad inválido.' })
  type?: ActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha inválida.' })
  performedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  distanceM?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  durationSec?: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;

  // si viene, reemplaza toda la lista de intervalos
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityIntervalInput)
  intervals?: ActivityIntervalInput[];
}
