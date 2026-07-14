import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { SetType } from '@prisma/client';

export class AddSetDto {
  @IsOptional()
  @IsEnum(SetType)
  type?: SetType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;
}
