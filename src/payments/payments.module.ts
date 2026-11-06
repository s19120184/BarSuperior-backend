import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { TablesModule } from 'src/tables/tables.module';
import { AuthModule } from 'src/auth/auth.module';
import { CashShift } from 'src/cash-register/entities/cash-shift.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Table } from 'src/tables/entities/table.entity';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports:[
    TypeOrmModule.forFeature([Payment, Order, Table, CashShift]),
    OrdersModule,
    TablesModule,
    AuthModule
  ],
  exports:[TypeOrmModule, PaymentsService]
})
export class PaymentsModule {}
