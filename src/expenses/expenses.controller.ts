import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService
  ) {}

  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() createExpenseDto: CreateExpenseDto,
  @GetUser() user:User
) {
    return this.expensesService.create(createExpenseDto, user);
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get('suppliers')
  @Auth(ValidRoles.admin)
  getSuppliers(@GetUser() user:User){
    return this.expensesService.getSuppliers()
  }

  @Get(':term')
  findByTerm(@Param('term') id: string) {
    return this.expensesService.findByTerm(id);
  }

  @Get('date/:date')
  findBydDate(@Param('date') date: string) {
    return this.expensesService.findByDate(date);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe ) id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Patch('remove/:id')
  remove(@Param('id' , ParseUUIDPipe) id: string) {
    return this.expensesService.remove(id);
  }

   @Patch('restore/:id')
    restore(@Param('id' , ParseUUIDPipe) id: string) {
    return this.expensesService.restore(id);
  }
}
