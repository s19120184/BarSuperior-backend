import { Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from './entities/table.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Table])],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TypeOrmModule, TablesService], // Se exporta para que OrdersModule pueda validar y cambiar estados de mesas
})
export class TablesModule {}
