import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PlanItemInput } from './plan-item.input';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Poné un nombre al plan.' })
  @MaxLength(60)
  name?: string;

  // si viene, reemplaza todos los ítems del plan
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemInput)
  items?: PlanItemInput[];
}
