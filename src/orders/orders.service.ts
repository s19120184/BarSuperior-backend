import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { DataSource, In, Repository } from 'typeorm';
import { handleDBExceptions } from 'src/helpers/handleDBExceptions';
import { User } from 'src/auth/entities/user.entity';
import { CreateOrderDto } from './dtos/create-order.dto';

import { Table, TableStatus } from '../tables/entities/table.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'src/catalogo-inventario/entities/products.entity';
import { AddItemDto } from './dtos/add-item.dto';
import { it, only } from 'node:test';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, waiter: User) {
    const { tableId, items } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar la mesa
      const table = await queryRunner.manager.findOneBy(Table, { id: tableId });

      console.log(table)
      if (!table) {
        throw new NotFoundException(`Mesa con ID "${tableId}" no encontrada`);
      }

      if (table.status === TableStatus.INACTIVE) {
        throw new BadRequestException(
          'No se puede abrir comanda en una mesa inactiva',
        );
      }

      if (table.status === TableStatus.OCCUPIED)
        throw new BadRequestException('Mesa no disponible');

      // 2. Procesar y totalizar los productos
      let calculatedTotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of items) {
        const product = await queryRunner.manager.findOneBy(Product, {
          id: itemDto.productId,
        });

        if (!product || !product.is_active) {
          throw new NotFoundException(
            `Producto "${itemDto.productId}" no disponible para la venta`,
          );
        }

        // Control de inventario para productos cerrados (no preparados)
        if (!product.is_prepared) {
          if (product.stock < itemDto.quantity) {
            throw new BadRequestException(
              `Stock insuficiente para "${product.title}". Disponibles: ${product.stock}`,
            );
          }
          product.stock -= itemDto.quantity;
          await queryRunner.manager.save(product);
        }

        const subtotal = Number(product.price) * itemDto.quantity;
        calculatedTotal += subtotal;

        const orderItem = queryRunner.manager.create(OrderItem, {
          product,
          quantity: itemDto.quantity,
          unitPrice: product.price,
          subtotal,
          notes: itemDto.notes,
        });

        orderItems.push(orderItem);
      }

      // 3. Crear y guardar la comanda
      const order = queryRunner.manager.create(Order, {
        table,
        waiter,
        items: orderItems,
        total: calculatedTotal,
        status: OrderStatus.OPEN,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // 4. Marcar la mesa como ocupada
      table.status = TableStatus.OCCUPIED;
      await queryRunner.manager.save(table);

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
     
      handleDBExceptions(error, 'OrderService');
    } finally {
      await queryRunner.release();
    }
  }

  // Agregar una ronda extra de tragos a una mesa ya abierta
  async addItemsToOrder(orderId: string, itemsDto: AddItemDto[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    console.log(itemsDto)
    try {
      // 1. Cargar la orden con sus items existentes y los productos de esos items
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: {
          table: true,
          items: {
            product: true,
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Comanda "${orderId}" no encontrada`);
      }

      if (order.status !== OrderStatus.OPEN) {
        throw new BadRequestException(
          'No se pueden agregar productos a una comanda cerrada o pagada',
        );
      }

      if (!order.items) {
        order.items = [];
      }

      let additionalTotal = 0;

      for (const itemDto of itemsDto ) {
        const product = await queryRunner.manager.findOneBy(Product, {
          id: itemDto.productId,
        });

        if (!product || !product.is_active) {
          throw new NotFoundException(
            `Producto con ID "${itemDto.productId}" no disponible para la venta`,
          );
        }

        // Validar y descontar stock si no es preparado
        if (!product.is_prepared) {
          if (product.stock < itemDto.quantity) {
            throw new BadRequestException(
              `Stock insuficiente para "${product.title}". Disponibles: ${product.stock}`,
            );
          }
          product.stock -= itemDto.quantity;
          await queryRunner.manager.save(product);
        }

        const itemSubtotal = Number(product.price) * itemDto.quantity;
        additionalTotal += itemSubtotal;

        // Normalizar notas para comparar (ej: undefined vs null vs "")
        const incomingNotes = itemDto.notes?.trim() || null;

        // 2. Buscar si el producto ya existe en la orden con las mismas notas
        const existingItem = order.items.find((item) => {
          // const currentItemNotes = item.notes?.trim() || null;
          return item.product.id === product.id;
        });

        if (existingItem) {
          // CASO A: Ya existe -> Actualizamos cantidad y subtotal del registro existente
          existingItem.quantity += itemDto.quantity;
          existingItem.subtotal = Number(existingItem.subtotal) + itemSubtotal;

          await queryRunner.manager.save(existingItem);
        } else {
          // CASO B: Es nuevo -> Creamos la nueva línea
          const newItem = queryRunner.manager.create(OrderItem, {
            order,
            product,
            quantity: itemDto.quantity,
            unitPrice: product.price,
            subtotal: itemSubtotal,
            notes: incomingNotes,
          });

          const savedItem = await queryRunner.manager.save(newItem);
          order.items.push(savedItem);
        }
      }

      // 3. Actualizar el total general de la comanda
      order.total = Number(order.total) + additionalTotal;
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleDBExceptions(error, 'OrderServer');
    } finally {
      await queryRunner.release();
    }

    // 4. Retornar la orden fresca desde la BD
    return await this.findOne(orderId);
  }

  async findOnebyIdTable(id:string){

    const order = await this.orderRepository.findOne({
      where:{
        table:{
          id: id
        },
        status:In([OrderStatus.OPEN])
      },relations: {
        table: true,
        waiter: true,
        items: {
          product: true,
        },
      },
      order:{createdAt:'DESC'}
    })

    if(!order){
      throw new NotFoundException(`Comanda con ID "${id}" no encontrada`);
    }

    return order
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        table: true,
        waiter: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Comanda con ID "${id}" no encontrada`);
    }

    return order;
  }

  async findAll(status?: OrderStatus): Promise<Order[]> {
    return await this.orderRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      relations: {
        items: {
          product: true,
        },
      },
    });
  }

  async removeOrderItem(
    orderId: string,
    orderItemId: string,
    quantityToRemove?: number,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cargar la orden
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: { table: true },
      });

      if (!order) {
        throw new NotFoundException(
          `Comanda con ID "${orderId}" no encontrada`,
        );
      }

      if (order.status !== OrderStatus.OPEN) {
        throw new BadRequestException(
          'Solo se pueden modificar o cancelar productos en comandas abiertas',
        );
      }

      // 2. Cargar el ítem con su producto asociado
      const item = await queryRunner.manager.findOne(OrderItem, {
        where: { id: orderItemId, order: { id: orderId } },
        relations: { product: true },
      });

      if (!item) {
        throw new NotFoundException(
          `El ítem "${orderItemId}" no pertenece a esta comanda`,
        );
      }

      // VALIDACIÓN DE SEGURIDAD OPERATIVA:
      if (quantityToRemove && quantityToRemove > item.quantity) {
        throw new BadRequestException(
          `No se pueden remover ${quantityToRemove} unidades. La orden solo contiene ${item.quantity} de "${item.product.title}".`,
        );
      }

      // Determinar la cantidad real a descontar
      const unitsToDeduct =
        quantityToRemove && quantityToRemove < item.quantity
          ? quantityToRemove
          : item.quantity;

      const amountToDeduct = Number(item.unitPrice) * unitsToDeduct;

      // 3. Devolver stock si el producto es físico/cerrado
      if (!item.product.is_prepared) {
        item.product.stock += unitsToDeduct;
        await queryRunner.manager.save(item.product);
      }

      // 4. Actualizar o eliminar el registro del ítem
      if (unitsToDeduct === item.quantity) {
        // Cancelación total de la línea
        await queryRunner.manager.remove(item);
      } else {
        // Cancelación parcial: restar cantidad y actualizar subtotal
        item.quantity -= unitsToDeduct;
        item.subtotal = Number(item.subtotal) - amountToDeduct;
        await queryRunner.manager.save(item);
      }

      // 5. Actualizar el total general de la comanda
      order.total = Math.max(0, Number(order.total) - amountToDeduct);
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleDBExceptions(error, 'OrderService');
    } finally {
      await queryRunner.release();
    }

    // 6. Retornar la comanda actualizada
    return await this.findOne(orderId);
  }

  // Prepara la cuenta para cobro (impresión de precuenta)
  async closeOrder(id: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException('Solo se pueden cerrar comandas que estén abiertas');
    }
    order.status = OrderStatus.CLOSED;
    return await this.orderRepository.save(order);
  }
}
