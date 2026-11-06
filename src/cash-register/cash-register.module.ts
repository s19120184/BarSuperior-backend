import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Expense } from 'src/expenses/entities/expense.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { CashShift } from './entities/cash-shift.entity';
import { CashMovement } from './entities/cash-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashShift, CashMovement, Payment, Expense]),
    AuthModule,
  ],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService, TypeOrmModule]
})
export class CashRegisterModule {}
