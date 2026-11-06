import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenShiftDto {
  @IsNumber({}, { message: 'El fondo inicial debe ser un número válido' })
  @Min(0, { message: 'El fondo inicial no puede ser negativo' })
  @IsNotEmpty({ message: 'El fondo inicial es requerido' })
  initialAmount!: number;

  @IsString()
  @IsOptional()
  shiftName?: string;
}