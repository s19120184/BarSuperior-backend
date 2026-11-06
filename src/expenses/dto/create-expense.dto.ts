
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MinLength(3, { message: 'La descripción debe tener al menos 3 caracteres' })
  @MaxLength(255, { message: 'La descripción no puede exceder los 255 caracteres' })
  description!: string;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount!: number;

  @IsEnum(PaymentMethod, {
    message: 'El método de pago debe ser CASH, CARD o TRANSFER',
  })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString({ message: 'El proveedor debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El proveedor no puede exceder los 100 caracteres' })
  @IsOptional()
  supplier?: string;

  @IsDateString(
    {},
    { message: 'La fecha del gasto debe ser una fecha válida (YYYY-MM-DD)' },
  )
  @IsOptional()
  expenseDate?: string;

  @IsUUID('4', { message: 'El categoryId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoryId!: string;
}