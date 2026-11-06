import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddItemDto } from './add-item.dto';

export class CreateOrderDto {
  @IsUUID('4', { message: 'El tableId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La mesa es obligatoria para abrir una comanda' })
  tableId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'La comanda debe incluir al menos un producto' })
  @Type(() => AddItemDto)
  items!: AddItemDto[];

  
}