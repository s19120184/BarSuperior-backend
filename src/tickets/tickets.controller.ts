import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // GET /tickets/precheck/:orderId
  @Get('precheck/:orderId')
  @Auth(ValidRoles.admin)
  getPrecheck(@Param('orderId', ParseUUIDPipe) orderId: string,@GetUser() user:User) {
    return this.ticketsService.getPrecheckData(orderId);
  }

  // GET /tickets/receipt/:orderId
  @Get('receipt/:orderId')
  getReceipt(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.ticketsService.getReceiptData(orderId);
  }

  @Get('corte-z/:shiftId')
  getCorteZByShift(@Param('shiftId') shiftId: string) {
    return this.ticketsService.getCorteZTicket(shiftId);
  }
}