import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CatalogoInventarioService } from './catalogo-inventario.service';
import { create } from 'domain';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from './dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductsService } from './product.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { userInfo } from 'os';

@Controller('catalogo-inventario')
export class CatalogoInventarioController {
  constructor(
    private readonly catalogoInventarioService: CatalogoInventarioService,
    private readonly productService: ProductsService,
  ) {}

  @Post()
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.catalogoInventarioService.createCategory(createCategoryDto);
  }

  @Get()
  getAllCategories(@Param('term') term?: string) {
    console.log(term);
    return this.catalogoInventarioService.getAllCategory();
  }

  @Patch(':id')
  updatedCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.catalogoInventarioService.updateCategory(id, updateCategoryDto);
  }
  @Delete(':id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogoInventarioService.deleteCategory(id);
  }

  //productos

  @Post('product')
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: User) {
    console.log(user);
    return this.productService.create(createProductDto, user);
  }

  @Get('product/pos')
  findAllForPos() {
    return this.productService.findAllForPos();
  }

  @Get('product')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productService.findAll(paginationDto);
  }

  // Permite buscar por UUID o por slug (ej. 'cerveza_corona_355ml')
  @Get('product/:term')
  findOneProduct(@Param('term') term: string) {
    return this.productService.findOne(term);
  }

  @Patch('product/:idProduct')
  @Auth(ValidRoles.admin)
  updateProduct(
    @Param('idProduct', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ) {
    return this.productService.update(id, updateProductDto, user);
  }

  @Delete('product/:idProduct')
  @HttpCode(HttpStatus.NO_CONTENT)
  removProduct(@Param('idProduct', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
}
