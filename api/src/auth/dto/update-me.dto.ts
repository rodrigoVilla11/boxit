import { IsEnum } from 'class-validator';
import { WeightUnit } from '@prisma/client';

export class UpdateMeDto {
  @IsEnum(WeightUnit, { message: 'Unidad inválida.' })
  weightUnit!: WeightUnit;
}
