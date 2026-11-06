import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../entities/categories.entity';

export class CreateCategoryDto {
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title!: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  description?: string;


  @IsEnum(CategoryType, {
    message: 'El tipo debe ser PRODUCT, EXPENSE o BOTH',
  })
  @IsOptional()
  type?: CategoryType;

  
}
