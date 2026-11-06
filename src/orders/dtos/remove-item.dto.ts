

import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class RemoveOrderItemDto {
  @IsInt({ message: 'La cantidad a remover debe ser un número entero' })
  @IsPositive({ message: 'La cantidad a remover debe ser mayor a 0' })
  @IsOptional()
  quantity?: number; // Si no se envía, se cancela la línea completa
}