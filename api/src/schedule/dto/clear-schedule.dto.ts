import { IsOptional, Matches } from 'class-validator';

export class ClearScheduleDto {
  // Si viene, borra sólo desde ese día (inclusive); si no, borra todo.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD).' })
  from?: string;
}
