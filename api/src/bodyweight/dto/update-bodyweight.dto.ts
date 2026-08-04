import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateBodyweightDto {
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Peso inválido.' })
  @Max(700, { message: 'Peso inválido.' })
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Porcentaje de grasa inválido.' })
  @Max(70, { message: 'Porcentaje de grasa inválido.' })
  bodyFatPct?: number | null;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha inválida.' })
  takenAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;
}
