import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { User } from 'src/auth/entities/user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}



  // POST /payments
  @Post()
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.OK)
  processPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() cashier: User,
  ) {
   
    return this.paymentsService.processPayment(createPaymentDto, cashier);
  }

  // GET /payments/order/:orderId
  @Get('order/:orderId')
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.findPaymentsByOrder(orderId);
  }


  // GET /payments/order/:orderId/status
  @Get('order/:orderId/status')
  getOrderPaymentStatus(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.getOrderPaymentStatus(orderId);
  }

}
