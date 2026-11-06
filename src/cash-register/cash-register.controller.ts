import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { OpenShiftDto } from './dtos/open-shift.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';
import { CreateCashMovementDto } from './dtos/create-movement.dto';
import { CloseShiftDto } from './dtos/close-shift.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { QueryShiftsDto } from './dtos/query-shifts.dto';

@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashService: CashRegisterService) {}
  

  // POST /cash-register/open -> Apertura de turno con fondo inicial
  @Post('open')
  @Auth(ValidRoles.cashier)
  openShift(@Body() dto: OpenShiftDto, @GetUser() user: User) {
    return this.cashService.openShift(dto, user);
  }

  // GET /cash-register/current -> Saber si la caja está abierta y sus datos
  @Get('current')
  getCurrentShift() {
    return this.cashService.getActiveShift();
  }

  // GET /cash-register/audit -> Arqueo en vivo (lo que debería haber ahora)
  @Get('audit')
  getCurrentAudit() {
    return this.cashService.getCurrentShiftAudit();
  }

  // POST /cash-register/movement -> Inyección de cambio
  @Post('movement')
  @Auth(ValidRoles.admin , ValidRoles.cashier)
  addMovement(@Body() dto: CreateCashMovementDto, @GetUser() user: User) {
    console.log('movement')
    return this.cashService.addMovement(dto, user);
  }

  // POST /cash-register/close -> Corte y cierre de turno
  @Post('close')
  @Auth(ValidRoles.admin)
  closeShift(@Body() dto: CloseShiftDto, @GetUser() user: User) {
    return this.cashService.closeShift(dto, user);
  }


  //history?startDate=2026-09-20&endDate=2026-09-26
  ///history?limit=5&offset=5
  //history?status=OPEN
  @Get('history')
  @Auth(ValidRoles.admin)
  getShiftsHistory(@Query() queryDto: QueryShiftsDto, @GetUser() user: User) {
    return this.cashService.getShiftsHistory(queryDto);
  }

  
}
