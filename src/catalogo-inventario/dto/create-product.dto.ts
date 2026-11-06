import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';


export class CreateProductDto {
   @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title!: string;

  @IsNumber({}, { message: 'El precio debe ser un valor numérico' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @IsOptional()
  price?: number;

  @IsString({ message: 'El slug debe ser una cadena de texto' })
  @IsOptional()
  slug?: string;

  @IsArray({ message: 'Sizes debe ser un arreglo de elementos' })
  @IsString({ each: true, message: 'Cada medida o tamaño debe ser texto' })
  @IsOptional()
  sizes?: string[];

  @IsBoolean({ message: 'is_prepared debe ser un valor booleano' })
  @IsOptional()
  is_prepared?: boolean;

  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  @IsOptional()
  is_active?: boolean;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @IsOptional()
  stock?: number;

  @IsUUID('4', { message: 'El categoryId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoryId!: string;

  @IsArray({ message: 'images debe ser un arreglo' })
  @IsString({ each: true, message: 'Cada imagen debe ser una URL en formato texto' })
  @IsOptional()
  images?: string[];

  

}