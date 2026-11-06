import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseShiftDto {
  @IsNumber({}, { message: 'El efectivo reportado debe ser numérico' })
  @Min(0, { message: 'El efectivo reportado no puede ser negativo' })
  @IsNotEmpty({ message: 'Debes ingresar el conteo físico de efectivo' })
  actualCash!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}