import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBodyweightDto {
  // siempre en kg; la UI convierte según la unidad del usuario
  @IsNumber()
  @Min(1, { message: 'Peso inválido.' })
  @Max(700, { message: 'Peso inválido.' })
  weightKg!: number;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha inválida.' })
  takenAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;
}
