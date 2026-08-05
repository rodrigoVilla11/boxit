import { IsInt, IsOptional, Min } from 'class-validator';

export class SetSupersetDto {
  // entero del grupo, o null/omitido para desagrupar
  @IsOptional()
  @IsInt()
  @Min(1)
  group?: number | null;
}
