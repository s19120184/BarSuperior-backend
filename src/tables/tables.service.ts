import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Table, TableStatus } from './entities/table.entity';
import { Repository } from 'typeorm';
import { CreateTableDto } from './dtos/create-table.dto';
import { handleDBExceptions } from 'src/helpers/handleDBExceptions';
import { UpdateTableDto } from './dtos/update-table.dto';
import { isUUID } from 'class-validator';
import { FilterTableDto } from './dtos/filter-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}


  async create(createTableDto: CreateTableDto) {
    try {
      const table = this.tableRepository.create(createTableDto);
      return await this.tableRepository.save(table);
    } catch (error) {
      handleDBExceptions(error,"TablesServie");
    }
  }

  async findAll(filterTableDto: FilterTableDto): Promise<Table[]> {
    const { status, zone } = filterTableDto;
    const query = this.tableRepository.createQueryBuilder('table');

    if (status) {
      query.andWhere('table.status = :status', { status });
    }

    if (zone) {
      query.andWhere('LOWER(table.zone) = :zone', {
        zone: zone.toLowerCase().trim(),
      });
    }

    query.orderBy('table.number', 'ASC');

    return await query.getMany();
  }

  async findOne(term: string): Promise<Table> {
    let table: Table | null = null;

    if (isUUID(term)) {
      table = await this.tableRepository.findOneBy({ id: term });
    } else if (!isNaN(+term)) {
      table = await this.tableRepository.findOneBy({ number: +term });
    }

    if (!table) {
      throw new NotFoundException(`Mesa con identificador o número "${term}" no encontrada`);
    }

    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto) {
    const table = await this.tableRepository.preload({
      id,
      ...updateTableDto,
    });

    if (!table) {
      throw new NotFoundException(`Mesa con ID "${id}" no encontrada`);
    }

    try {
      return await this.tableRepository.save(table);
    } catch (error) {
      handleDBExceptions(error,'TableServise');
    }
  }

  async changeStatus(id: string, status: TableStatus): Promise<Table> {
    const table = await this.findOne(id);
    table.status = status;
    return await this.tableRepository.save(table);
  }

  async remove(id: string){
    const table = await this.findOne(id);
    // Borrado lógico pasando a INACTIVE para no romper historial de comandas
    table.status = TableStatus.INACTIVE;
    await this.tableRepository.save(table);
  }

}
