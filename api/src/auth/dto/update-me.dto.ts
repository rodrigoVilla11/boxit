import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Sex, WeightUnit } from '@prisma/client';

// Los campos de perfil aceptan null para limpiarse: ValidateIf saltea las demás
// reglas cuando el valor es null, pero deja pasar el null al servicio.
const notNull = (_: unknown, v: unknown) => v !== null;

export class UpdateMeDto {
  @IsOptional()
  @IsEnum(WeightUnit, { message: 'Unidad inválida.' })
  weightUnit?: WeightUnit;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre es muy corto.' })
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @ValidateIf(notNull)
  @IsDateString({}, { message: 'Fecha de nacimiento inválida.' })
  birthDate?: string | null;

  @IsOptional()
  @ValidateIf(notNull)
  @IsEnum(Sex, { message: 'Valor inválido.' })
  sex?: Sex | null;

  @IsOptional()
  @ValidateIf(notNull)
  @IsNumber()
  @Min(80, { message: 'Estatura inválida.' })
  @Max(260, { message: 'Estatura inválida.' })
  heightCm?: number | null;

  // objetivo de peso, siempre en kg (la UI convierte)
  @IsOptional()
  @ValidateIf(notNull)
  @IsNumber()
  @Min(20, { message: 'Peso objetivo inválido.' })
  @Max(500, { message: 'Peso objetivo inválido.' })
  goalWeightKg?: number | null;

  // Recordatorios push
  // marca el onboarding como completo (setea onboardedAt)
  @IsOptional()
  @IsBoolean()
  onboarded?: boolean;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number;

  @IsOptional()
  @ValidateIf(notNull)
  @IsInt()
  @Min(1)
  @Max(30)
  inactivityReminderDays?: number | null;

  @IsOptional()
  @ValidateIf(notNull)
  @IsInt()
  @Min(-840)
  @Max(840)
  timezoneOffsetMin?: number | null;
}
