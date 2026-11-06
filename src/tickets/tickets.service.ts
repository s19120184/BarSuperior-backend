import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { TicketDataDto } from './dtos/ticket-data.dto';
import { ShiftTicketResponse } from './interfaces/corte-ticke.interface';
import { CashRegisterService } from 'src/cash-register/cash-register.service';


@Injectable()
export class TicketsService {
  private readonly businessInfo = {
    name: 'BAR SUPERIOR',
    taxId: 'BSU-260920-XXX',
    address: 'Allende , Moroleon GTO',
    phone: '+52 (55) 1234-5678',
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly cashRegisterService: CashRegisterService,
  ) {}

  // 1. Datos para la Precuenta (antes de cobrar)
  async getPrecheckData(orderId: string): Promise<TicketDataDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        table: true,
        waiter: true,
        items: { product: true },
      },
    });

    if (!order) {
      throw new NotFoundException(`Comanda con ID "${orderId}" no encontrada`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede generar comprobante de una comanda cancelada');
    }

    const total = Number(order.total);

    return {
      business: this.businessInfo,
      order: {
        id: order.id,
        shortId: order.id.slice(0, 8).toUpperCase(),
        tableNumber: order.table.number,
        zone: order.table.zone,
        waiter: order.waiter.fullName,
        openedAt: order.createdAt,
      },
      items: order.items.map((item) => ({
        name: item.product.title,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        notes: item.notes || undefined,
      })),
      totals: {
        subtotal: total,
        total: total,
        suggestedTips: {
          tip10: Number((total * 0.1).toFixed(2)),
          tip15: Number((total * 0.15).toFixed(2)),
          tip20: Number((total * 0.2).toFixed(2)),
        },
      },
    };
  }

  // 2. Datos para el Recibo Final (tras liquidar en caja)
  async getReceiptData(orderId: string): Promise<TicketDataDto> {
    const precheck = await this.getPrecheckData(orderId);

    const payments = await this.paymentRepository.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'ASC' },
    });

    return {
      ...precheck,
      totals: {
        subtotal: precheck.totals.subtotal,
        total: precheck.totals.total,
        suggestedTips: undefined, // En el ticket final ya no se sugieren propinas
      },
      payments: payments.map((payment) => ({
        method: payment.method,
        amount: Number(payment.amount),
        tip: Number(payment.tip),
        receivedAmount: payment.receivedAmount ? Number(payment.receivedAmount) : undefined,
        change: payment.change ? Number(payment.change) : undefined,
      })),
    };
  }

  async getCorteZTicket(shiftId?: string): Promise<ShiftTicketResponse> {
    // Si no pasan shiftId, tomamos el arqueo del turno actual abierto
    const auditData = await this.cashRegisterService.getShiftAudit(shiftId!);

    const isClosed = !!auditData.shiftInfo.closedAt;

    let differenceStatus = 'EN_CURSO';
    if (isClosed) {
      const diff = auditData.reconciliation?.difference ?? 0;
      if (diff === 0) differenceStatus = 'CUADRADA';
      else if (diff > 0) differenceStatus = 'SOBRANTE';
      else differenceStatus = 'FALTANTE';
    }

    return {
      business: {
        name: 'BAR SUPERIOR',
        branch: 'Sucursal Principal',
        ticketType: isClosed ? 'CORTE_Z' : 'CORTE_X',
      },
      shift: {
        id: auditData.shiftInfo.id,
        name: auditData.shiftInfo.name,
        openedAt: auditData.shiftInfo.openedAt,
        closedAt: auditData.shiftInfo.closedAt,
        openedBy: auditData.shiftInfo.openedBy,
        closedBy: auditData.shiftInfo.closedBy,
      },
      salesSummary: {
        cashSales: auditData.income.cash,
        cardSales: auditData.income.card,
        transferSales: auditData.income.transfer,
        totalSales: auditData.income.totalSales,
        totalTips: auditData.income.totalTips,
        totalTransactions: auditData.income.totalTransactions ?? 0,
      },
      cashMovements: {
        initialAmount: auditData.financials.initialAmount,
        injections: auditData.financials.totalCashInjections,
        expenses: auditData.financials.totalCashExpenses,
      },
      cashReconciliation: {
        expectedInDrawer: auditData.financials.expectedCashInDrawer,
        actualReported: auditData.reconciliation?.actualCash,
        difference: auditData.reconciliation?.difference,
        status: differenceStatus,
      },
      breakdown: {
        expenses: auditData.cashExpenses.items.map((exp: any) => ({
          description: exp.description,
          amount: Number(exp.amount),
          supplier: exp.supplier || 'N/A',
        })),
      },
    };
  }


}