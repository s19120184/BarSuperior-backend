import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesModule } from 'src/tables/tables.module';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogoInventarioModule } from 'src/catalogo-inventario/catalogo-inventario.module';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    TablesModule,
    CatalogoInventarioModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [TypeOrmModule, OrdersService]
})
export class OrdersModule {}
