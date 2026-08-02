import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PlanItemInput } from './plan-item.input';

export class CreatePlanDto {
  @IsString()
  @MinLength(1, { message: 'Poné un nombre al plan.' })
  @MaxLength(60)
  name!: string;

  // un plan puede empezar vacío (sin ArrayMinSize)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemInput)
  items!: PlanItemInput[];
}
