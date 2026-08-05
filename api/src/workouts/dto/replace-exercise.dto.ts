import { IsOptional, IsString } from 'class-validator';

export class ReplaceExerciseDto {
  @IsString()
  exerciseId!: string;

  // id de cliente para la serie nueva (idempotencia offline)
  @IsOptional()
  @IsString()
  setId?: string;
}
