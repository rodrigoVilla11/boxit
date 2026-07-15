import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SetType } from '@prisma/client';

export class UpdateSetDto {
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
  @IsEnum(SetType)
  type?: SetType;

  // esfuerzo percibido 0–10 (null para borrar)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rpe?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;
}
