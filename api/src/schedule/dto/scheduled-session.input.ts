import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ActivityType, PlanItemKind } from '@prisma/client';

/** Una sesión del calendario: igual que PlanItemInput pero con fecha absoluta. */
export class ScheduledSessionInput {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD).' })
  date!: string;

  @IsEnum(PlanItemKind, { message: 'Tipo de sesión inválido.' })
  kind!: PlanItemKind;

  // routineId es obligatorio sólo si la sesión es una rutina
  @ValidateIf((o) => o.kind === 'ROUTINE')
  @IsString()
  routineId?: string;

  // plantilla de cardio (opcional): si viene, el server copia tipo y objetivos
  @IsOptional()
  @IsString()
  cardioRoutineId?: string | null;

  // activityType es obligatorio sólo si el cardio es suelto (sin plantilla)
  @ValidateIf((o) => o.kind === 'ACTIVITY' && !o.cardioRoutineId)
  @IsEnum(ActivityType, { message: 'Tipo de actividad inválido.' })
  activityType?: ActivityType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500_000)
  targetDistanceM?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  targetDurationSec?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string | null;
}
