import { Module } from '@nestjs/common';
import { CatalogoInventarioService } from './catalogo-inventario.service';
import { CatalogoInventarioController } from './catalogo-inventario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from './entities/categories.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ProductsService } from './product.service';

@Module({
  controllers: [CatalogoInventarioController],
  providers: [CatalogoInventarioService,ProductsService],
  imports:[
    TypeOrmModule.forFeature([Product,ProductImage,Category]),
    AuthModule,//Para proteger rutas del catalogo
  ],
  exports:[CatalogoInventarioService,TypeOrmModule,ProductsService]
})
export class CatalogoInventarioModule {}
