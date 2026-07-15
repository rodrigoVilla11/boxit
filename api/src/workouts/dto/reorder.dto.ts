import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderDto {
  // lista ordenada COMPLETA de ids (el server asigna order = índice + 1)
  @IsArray()
  @ArrayMinSize(1, { message: 'Falta el orden.' })
  @IsString({ each: true })
  ids!: string[];
}
