import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID('4', { message: 'El orderId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El identificador de la orden es obligatorio' })
  orderId!: string;

  @IsNumber({}, { message: 'El monto a abonar debe ser numérico' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  amount!: number;

  @IsNumber({}, { message: 'La propina debe ser numérica' })
  @Min(0, { message: 'La propina no puede ser negativa' })
  @IsOptional()
  tip?: number;

  @IsEnum(PaymentMethod, {
    message: 'El método de pago debe ser: CASH, CARD o TRANSFER',
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  method!: PaymentMethod;

  @IsNumber({}, { message: 'El monto recibido debe ser numérico' })
  @IsPositive({ message: 'El monto recibido debe ser mayor a 0' })
  @IsOptional()
  receivedAmount?: number;

  @IsString({ message: 'La referencia debe ser una cadena de texto' })
  @IsOptional()
  transactionReference?: string;
}