import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SetType } from '@prisma/client';

export class AddSetDto {
  // id generado por el cliente (logueo offline idempotente)
  @IsOptional()
  @IsString()
  id?: string;

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
