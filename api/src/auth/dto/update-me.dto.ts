import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WeightUnit } from '@prisma/client';

export class UpdateMeDto {
  @IsOptional()
  @IsEnum(WeightUnit, { message: 'Unidad inválida.' })
  weightUnit?: WeightUnit;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre es muy corto.' })
  @MaxLength(60)
  name?: string;
}
