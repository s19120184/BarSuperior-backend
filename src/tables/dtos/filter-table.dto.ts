

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class FilterTableDto {
  @IsEnum(TableStatus, {
    message: 'Estado inválido. Opciones: AVAILABLE, OCCUPIED, RESERVED, INACTIVE',
  })
  @IsOptional()
  status?: TableStatus;

  @IsString()
  @IsOptional()
  zone?: string;
}