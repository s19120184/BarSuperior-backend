import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dtos/create-table.dto';
import { FilterTableDto } from './dtos/filter-table.dto';
import { UpdateTableDto } from './dtos/update-table.dto';
import { TableStatus } from './entities/table.entity';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  // GET /tables?status=AVAILABLE&zone=salon
  @Get()
  findAll(@Query() filterTableDto: FilterTableDto) {
    return this.tablesService.findAll(filterTableDto);
  }

  // Busca por UUID o por número de mesa (/tables/1 o /tables/uuid)
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.tablesService.findOne(term);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTableDto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, updateTableDto);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TableStatus,
  ) {
    return this.tablesService.changeStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.remove(id);
  }
}
