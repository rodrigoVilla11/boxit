import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Un intervalo es una fila-prescripción: reps × (distancia|tiempo) + descanso.
// distanceM / durationSec son POR repetición (el "400" de "8 × 400 m").
export class ActivityIntervalInput {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string | null;

  @IsInt()
  @Min(1, { message: 'Mínimo 1 repetición.' })
  @Max(200)
  reps!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  distanceM?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  durationSec?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  restSec?: number | null;
}
