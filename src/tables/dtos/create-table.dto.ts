import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
  @IsInt({ message: 'El número de mesa debe ser un valor entero' })
  @IsPositive({ message: 'El número de mesa debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El número de mesa es obligatorio' })
  number!: number;

  @IsInt({ message: 'La capacidad debe ser un número entero' })
  @IsPositive({ message: 'La capacidad debe ser de al menos 1 persona' })
  @IsOptional()
  capacity?: number;

  @IsString({ message: 'La zona debe ser una cadena de texto' })
  @MinLength(2, { message: 'La zona debe tener al menos 2 caracteres' })
  @IsOptional()
  zone?: string;

  @IsEnum(TableStatus, {
    message: 'El estado debe ser: AVAILABLE, OCCUPIED, RESERVED o INACTIVE',
  })
  @IsOptional()
  status?: TableStatus;
}