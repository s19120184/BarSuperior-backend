import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Payment, PaymentMethod } from './entities/payment.entity';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Table, TableStatus } from '../tables/entities/table.entity';
import { User } from '../auth/entities/user.entity';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { PaymentSummaryResponse } from 'src/interfaces/paymentSummary.interface';
import { CashShift, ShiftStatus } from 'src/cash-register/entities/cash-shift.entity';

// export interface PaymentSummaryResponse {
//   payment: Payment;
//   orderTotal: number;
//   totalPaid: number;
//   pendingBalance: number;
//   isOrderSettled: boolean;
//   change: number;
// }

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  async processPayment(
    createPaymentDto: CreatePaymentDto,
    cashier: User,
  ): Promise<PaymentSummaryResponse> {
    const {
      orderId,
      amount,
      tip = 0,
      method,
      receivedAmount,
      transactionReference,
    } = createPaymentDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // 1. VALIDACIÓN CLAVE DE CAJA: Verificar si hay un turno de caja abierto
      const activeShift = await queryRunner.manager.findOne(CashShift, {
        where: { status: ShiftStatus.OPEN },
      });

      if (!activeShift) {
        throw new BadRequestException(
          'No hay ninguna caja o turno abierto actualmente. Realiza la apertura de caja antes de cobrar.',
        );
      }




      // 2. Obtener la orden con su mesa
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: { table: true },
      });

      if (!order) {
        throw new NotFoundException(`Comanda con ID "${orderId}" no encontrada`);
      }

      if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('Esta comanda ya ha sido liquidada en su totalidad');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('No se pueden registrar pagos en una comanda cancelada');
      }

      // 3. Calcular los pagos previos aplicados a esta orden
      const previousPayments = await queryRunner.manager.find(Payment, {
        where: { order: { id: orderId } },
      });

      const alreadyPaid = previousPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      const orderTotal = Number(order.total);
      const remainingBalance = Number((orderTotal - alreadyPaid).toFixed(2));

      // 4. Validar que no se abone más del saldo restante
      if (amount > remainingBalance) {
        throw new BadRequestException(
          `El monto ingresado ($${amount}) supera el saldo pendiente ($${remainingBalance})`,
        );
      }

      // 5. Validar efectivo recibido y calcular cambio
      let calculatedChange = 0;
      if (method === PaymentMethod.CASH) {
        const totalToChargeInCash = amount + tip;
        if (receivedAmount !== undefined) {
          if (receivedAmount < totalToChargeInCash) {
            throw new BadRequestException(
              `El monto recibido en efectivo ($${receivedAmount}) es insuficiente. Total requerido (consumo + propina): $${totalToChargeInCash}`,
            );
          }
          calculatedChange = Number((receivedAmount - totalToChargeInCash).toFixed(2));
        }
      }

      // 6. Crear y persistir el registro del pago
      const payment = queryRunner.manager.create(Payment, {
        order,
        cashier,
        cashShift: activeShift,
        amount,
        tip,
        method,
        receivedAmount: receivedAmount ?? (amount + tip),
        change: calculatedChange,
        transactionReference,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // 7. Verificar si la orden quedó completamente saldada
      const newTotalPaid = Number((alreadyPaid + amount).toFixed(2));
      const newPendingBalance = Number((orderTotal - newTotalPaid).toFixed(2));
      const isSettled = newPendingBalance <= 0;

      if (isSettled) {
        // Pasar la comanda a PAID
        order.status = OrderStatus.PAID;
        await queryRunner.manager.save(order);

        // Liberar la mesa a AVAILABLE
        const table = order.table;
        if (table) {
          table.status = TableStatus.AVAILABLE;
          await queryRunner.manager.save(table);
        }
      }

      await queryRunner.commitTransaction();

      return {
        payment: savedPayment,
        orderTotal,
        totalPaid: newTotalPaid,
        pendingBalance: newPendingBalance,
        isOrderSettled: isSettled,
        change: calculatedChange,
        orderId: orderId
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Consultar historial de pagos de una comanda
  async findPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { order: { id: orderId } },
      relations: { cashier: true },
      order: { createdAt: 'ASC' },
    });
  }

  //consultar estado de cuenta de una mesa
  async getOrderPaymentStatus(orderId: string) {
    
  const order = await this.dataSource.getRepository(Order).findOne({
    where: { id: orderId },
    relations: { table: true, items: { product: true } },
  });

  if (!order) {
    throw new NotFoundException(`Comanda "${orderId}" no encontrada`);
  }

  const payments = await this.paymentRepository.find({
    where: { order: { id: orderId } },
    order: { createdAt: 'ASC' },
  });

  const totalPaid = payments.reduce(
    (acc, payment) => acc + Number(payment.amount),
    0,
  );
  const totalTips = payments.reduce(
    (acc, payment) => acc + Number(payment.tip),
    0,
  );

  const orderTotal = Number(order.total);
  const pendingBalance = Math.max(0, Number((orderTotal - totalPaid).toFixed(2)));

  return {
    orderId: order.id,
    orderStatus: order.status,
    table: {
      id: order.table?.id,
      number: order.table?.number,
    },
    total: orderTotal,
    totalPaid,
    totalTips,
    pendingBalance,
    isSettled: pendingBalance === 0,
    paymentsCount: payments.length,
    paymentsHistory: payments,
  };
}


  private handleDBExceptions(error: any): never {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Error al procesar el pago');
  }
}