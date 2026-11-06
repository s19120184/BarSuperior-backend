import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { CatalogoInventarioModule } from './catalogo-inventario/catalogo-inventario.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

import { CashRegisterModule } from './cash-register/cash-register.module';
import { SeedModule } from './seed/seed.module';
import { TicketsModule } from './tickets/tickets.module';
import { FilesModule } from './files/files.module';



@Module({
  imports: [
    ConfigModule.forRoot(),

    //configuracin typeOrm
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.HOST,
      port: +process.env.PORT_DB!,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,//todo:desactivar en produccion
    }),
    //para servir contenido estatico pnpm install @nestjs/serve-static
    ServeStaticModule.forRoot({
        rootPath: join(__dirname,'..', 'public'),}),
    
    
    AuthModule,
    
    
    CatalogoInventarioModule,
    
    
    ExpensesModule,
    
    
    TablesModule,
    
    
    OrdersModule,
    
    
    PaymentsModule,
    
    
    TicketsModule,
    
    
    CashRegisterModule,
    
    
    SeedModule,

    FilesModule,


  ],

  

  controllers: [],
  providers: [],
})
export class AppModule {}
