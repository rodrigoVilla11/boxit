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

export class CreateActivityDto {
  // id generado por el cliente (idempotencia ante doble-envío)
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(ActivityType, { message: 'Tipo de actividad inválido.' })
  type!: ActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha inválida.' })
  performedAt?: string;

  // distancia siempre en metros (canónico); la UI convierte km↔m
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityIntervalInput)
  intervals?: ActivityIntervalInput[];
}
