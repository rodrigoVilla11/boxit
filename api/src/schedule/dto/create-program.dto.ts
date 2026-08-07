import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ScheduledSessionInput } from './scheduled-session.input';

/**
 * Un programa multi-semana entra entero de una: nombre + todas sus sesiones
 * con fecha. 400 alcanza para 16 semanas × 7 días con margen.
 */
export class CreateProgramDto {
  @IsString()
  @MinLength(1, { message: 'Poné un nombre al programa.' })
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;

  @IsArray()
  @ArrayMinSize(1, { message: 'El programa necesita al menos una sesión.' })
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => ScheduledSessionInput)
  sessions!: ScheduledSessionInput[];
}
