import { IsOptional, IsString } from 'class-validator';

export class CreateWorkoutDto {
  // id generado por el cliente (para logueo offline idempotente)
  @IsOptional()
  @IsString()
  id?: string;
}
