import { Matches } from 'class-validator';

export class ScheduleRangeQuery {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD).' })
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD).' })
  to!: string;
}
