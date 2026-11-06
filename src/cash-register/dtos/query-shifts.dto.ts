import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftStatus } from '../entities/cash-shift.entity';

export class QueryShiftsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string; // Formato YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  endDate?: string;   // Formato YYYY-MM-DD

  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus; // OPEN o CLOSED (por defecto CLOSED para ver cortes terminados)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}