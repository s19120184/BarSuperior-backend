import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { CatalogoInventarioModule } from 'src/catalogo-inventario/catalogo-inventario.module';
import { AuthModule } from 'src/auth/auth.module';
import { ExpensesModule } from 'src/expenses/expenses.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports:[CatalogoInventarioModule,AuthModule,ExpensesModule, SeedModule]
})
export class SeedModule {}
