import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { CashRegisterModule } from 'src/cash-register/cash-register.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Payment]),
    AuthModule,
    CashRegisterModule
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}