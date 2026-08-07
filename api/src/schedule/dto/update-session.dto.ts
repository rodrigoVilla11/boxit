import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Mover de día o retocar objetivos/nota. El tipo (kind) no cambia. */
export class UpdateSessionDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD).' })
  date?: string;

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
