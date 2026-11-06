import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength, MaxLength, Matches, IsArray, IsEnum } from 'class-validator';
import { ValidRoles } from '../interfaces/valid-roles';

export class UpdateAuthDto extends PartialType(CreateUserDto) {
    @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have an uppercase, lowercase letter and a number',
  })
  password?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ValidRoles, { each: true })
  roles?: ValidRoles[];
}
