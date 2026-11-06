import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { User } from 'src/auth/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { OrderStatus } from './entities/order.entity';
import { AddItemDto } from './dtos/add-item.dto';
import { RemoveOrderItemDto } from './dtos/remove-item.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  //Abrir comanda en mesa
  @Post()
  @Auth( ValidRoles.admin)
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() waiter: User) {
    return this.ordersService.create(createOrderDto, waiter);
  }

  // Agregar rondas de consumo a comanda existente
  @Post(':id/items')
  addItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() items: AddItemDto[],
  ) {
    return this.ordersService.addItemsToOrder(id, items);
  }

  //consultar todas las ordens(opcionalmente filtrar por ?status=OPEN)
  @Get()
  getOrders(@Query('status') status: OrderStatus) {
    return this.ordersService.findAll();
  }

  @Get('table/:id')
  getOrdersById(@Param('id', ParseUUIDPipe) id: string){
     return this.ordersService.findOne(id)
  }

  @Get(':id/table')
  getOrdersByTable(@Param('id', ParseUUIDPipe) id: string){
     return this.ordersService.findOnebyIdTable(id)
  }

  // DELETE /orders/:orderId/items/:itemId (opcionalmente con body { "quantity": 1 })
  @Delete(':orderId/items/:itemId')
  removeOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() removeOrderItemDto: RemoveOrderItemDto,
  ) {
    return this.ordersService.removeOrderItem(
      orderId,
      itemId,
      removeOrderItemDto.quantity,
    );
  }

  // Cerrar mesa para pedir la cuenta
  @Patch(':id/close')
  closeOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.closeOrder(id);
  }
}
