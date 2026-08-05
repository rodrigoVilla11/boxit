import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
