import { IsInt, Matches, Max, Min } from 'class-validator';

export class DuplicateWeekDto {
  // Lunes de la semana a copiar (se duplica [weekStart, weekStart+6])
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD).' })
  weekStart!: string;

  @IsInt()
  @Min(1, { message: 'Mínimo 1 semana.' })
  @Max(26, { message: 'Máximo 26 semanas.' })
  weeks!: number;
}
