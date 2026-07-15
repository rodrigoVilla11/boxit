import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Equipment, Muscle } from '@prisma/client';

export class CreateExerciseDto {
  @IsString()
  @MinLength(2, { message: 'El nombre es muy corto.' })
  @MaxLength(60)
  name!: string;

  @IsEnum(Muscle, { message: 'Músculo primario inválido.' })
  primaryMuscle!: Muscle;

  @IsOptional()
  @IsArray()
  @IsEnum(Muscle, { each: true, message: 'Músculo secundario inválido.' })
  secondaryMuscles?: Muscle[];

  @IsEnum(Equipment, { message: 'Equipo inválido.' })
  equipment!: Equipment;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El video tiene que ser una URL válida.' })
  videoUrl?: string;
}
