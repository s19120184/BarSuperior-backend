import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateCashMovementDto {
  @IsNumber({}, { message: 'El monto debe ser numérico' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  amount!: number;

  @IsString({ message: 'El motivo debe ser texto' })
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  reason!: string;
}