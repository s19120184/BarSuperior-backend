import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AddItemDto {
  @IsUUID('4', { message: 'El productId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El producto es obligatorio' })
  productId!: string;

  @IsInt({ message: 'La cantidad debe ser un entero' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  quantity!: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}