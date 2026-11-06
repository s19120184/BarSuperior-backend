import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Expense } from './entities/expense.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/catalogo-inventario/entities/categories.entity';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogoInventarioModule } from 'src/catalogo-inventario/catalogo-inventario.module';
import { CashShift } from 'src/cash-register/entities/cash-shift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Category, CashShift]),
     AuthModule,
     CatalogoInventarioModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports:[ExpensesService]
})
export class ExpensesModule {}
