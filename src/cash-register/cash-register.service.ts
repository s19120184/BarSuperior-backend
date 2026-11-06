import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CashShift, ShiftStatus } from './entities/cash-shift.entity';
import { CashMovement, MovementType } from './entities/cash-movement.entity';
import { Payment, PaymentMethod } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { User } from '../auth/entities/user.entity';
import { OpenShiftDto } from './dtos/open-shift.dto';
import { CreateCashMovementDto } from './dtos/create-movement.dto';
import { CloseShiftDto } from './dtos/close-shift.dto';
import { QueryShiftsDto } from './dtos/query-shifts.dto';


//esto es un comenteario
@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashShift)
    private readonly shiftRepository: Repository<CashShift>,
    @InjectRepository(CashMovement)
    private readonly movementRepository: Repository<CashMovement>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  // 1. Obtener el turno activo actual
  async getActiveShift(): Promise<CashShift | null> {
    return await this.shiftRepository.findOne({
      where: { status: ShiftStatus.OPEN },
      order: { openedAt: 'DESC' },
    });
  }

  // 2. Apertura de caja
  async openShift(dto: OpenShiftDto, user: User): Promise<CashShift> {
    const active = await this.getActiveShift();
    if (active) {
      throw new BadRequestException(
        `Ya existe un turno abierto ("${active.shiftName}"). Debe cerrarse antes de abrir uno nuevo.`,
      );
    }

    const shift = this.shiftRepository.create({
      shiftName: dto.shiftName?.trim() || 'Turno Principal',
      initialAmount: dto.initialAmount,
      openedBy: user,
      status: ShiftStatus.OPEN,
    });

    return await this.shiftRepository.save(shift);
  }

  // 3. Inyección manual de cambio (efectivo al cajón)
  async addMovement(
    dto: CreateCashMovementDto,
    user: User,
  ): Promise<CashMovement> {
    const activeShift = await this.getActiveShift();
    if (!activeShift) {
      throw new BadRequestException(
        'No hay ninguna caja o turno abierto actualmente',
      );
    }

    const movement = this.movementRepository.create({
      cashShift: activeShift,
      type: MovementType.IN,
      amount: dto.amount,
      reason: dto.reason,
      user,
    });

    return await this.movementRepository.save(movement);
  }

  // 4. Arqueo en vivo (Balance actual sin cerrar el turno)
  async getCurrentShiftAudit() {
    const activeShift = await this.getActiveShift();
    if (!activeShift) {
      throw new NotFoundException('No hay ningún turno de caja abierto');
    }

    return await this.calculateShiftTotals(activeShift.id);
  }

  // 5. Corte y Cierre de Turno / Jornada
  async closeShift(dto: CloseShiftDto, user: User) {
    const activeShift = await this.getActiveShift();
    if (!activeShift) {
      throw new BadRequestException('No hay ningún turno abierto para cerrar');
    }

    const audit = await this.calculateShiftTotals(activeShift.id);

    const actualCash = Number(dto.actualCash);
    const expectedCash = audit.financials.expectedCashInDrawer;
    const difference = Number((actualCash - expectedCash).toFixed(2));

    activeShift.status = ShiftStatus.CLOSED;
    activeShift.finalCashReported = actualCash;
    activeShift.expectedCash = expectedCash;
    activeShift.difference = difference;
    activeShift.notes = dto.notes;
    activeShift.closedBy = user;
    activeShift.closedAt = new Date();

    const closedShift = await this.shiftRepository.save(activeShift);

    return {
      shift: closedShift,
      summary: audit,
      reconciliation: {
        actualCashReported: actualCash,
        expectedCash,
        difference,
        status:
          difference === 0
            ? 'CUADRADA'
            : difference > 0
              ? 'SOBRANTE'
              : 'FALTANTE',
      },
    };
  }


  // Obtener auditoría/arqueo por ID (o del turno activo si no se pasa ID)
  async getShiftAudit(shiftId?: string) {
    if (shiftId) {
      return await this.calculateShiftTotals(shiftId);
    }

    const activeShift = await this.getActiveShift();
    if (!activeShift) {
      throw new NotFoundException('No hay ningún turno de caja abierto actualmente');
    }

    return await this.calculateShiftTotals(activeShift.id);
  }


  // Método central de cálculo financiero del turno
  private async calculateShiftTotals(shiftId: string) {
    const shift = await this.shiftRepository.findOne({
      where: { id: shiftId },
      relations: { openedBy: true },
    });

    if (!shift) {
      throw new NotFoundException(`Turno con ID "${shiftId}" no encontrado`);
    }

    // A. Cobros (Payments) asociados al turno
    const payments = await this.paymentRepository.find({
      where: { cashShift: { id: shiftId } },
    });

    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let totalTips = 0;

    for (const p of payments) {
      const amount = Number(p.amount);
      const tip = Number(p.tip || 0);
      totalTips += tip;

      const totalCharged = amount + tip;

      if (p.method === PaymentMethod.CASH) {
        cashSales += totalCharged;
      } else if (p.method === PaymentMethod.CARD) {
        cardSales += totalCharged;
      } else if (p.method === PaymentMethod.TRANSFER) {
        transferSales += totalCharged;
      }
    }

    // B. Entradas de cambio (CashMovement tipo IN)
    const manualEntries = await this.movementRepository.find({
      where: {
        cashShift: { id: shiftId },
        type: MovementType.IN,
      },
    });

    const totalCashIn = manualEntries.reduce(
      (sum, m) => sum + Number(m.amount),
      0,
    );


 // C. Gastos de caja chica pagados en EFECTIVO vinculados a este turno
    const cashExpenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.registeredBy', 'user')
      .leftJoin('expense.cashShift', 'shift')
      .where('shift.id = :shiftId', { shiftId })
      .andWhere('expense.paymentMethod = :method', { method: 'CASH' })
      .getMany();

   

    const totalCashExpenses = cashExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );

    // D. Fórmula del cajón: Inicial + Cobros Efectivo + Inyecciones - Gastos Efectivo
    const initialAmount = Number(shift.initialAmount);
    const expectedCashInDrawer = Number(
      (initialAmount + cashSales + totalCashIn - totalCashExpenses).toFixed(2),
    );

    return {
      shiftInfo: {
        id: shift.id,
        name: shift.shiftName,
        openedAt: shift.openedAt,
        openedBy: shift.openedBy?.fullName ?? 'N/A',
        closedAt: shift.closedAt ?? undefined, // 👈
        closedBy: shift.closedBy?.fullName ?? undefined, // 👈
        initialAmount,
      },
      income: {
        cash: Number(cashSales.toFixed(2)),
        card: Number(cardSales.toFixed(2)),
        transfer: Number(transferSales.toFixed(2)),
        totalSales: Number((cashSales + cardSales + transferSales).toFixed(2)),
        totalTips: Number(totalTips.toFixed(2)),
        totalTransactions: payments.length, // 👈 Conteo real de cobros
      },
      cashInjections: {
        total: Number(totalCashIn.toFixed(2)),
        count: manualEntries.length,
        items: manualEntries,
      },
      cashExpenses: {
        total: Number(totalCashExpenses.toFixed(2)),
        count: cashExpenses.length,
        items: cashExpenses.map((exp) => ({
          id: exp.id,
          description: exp.description,
          amount: Number(exp.amount),
          category: exp.category,
          supplier: exp.supplier ?? undefined, // 👈 Agregar supplier
          //voucherNumber: exp.voucherNumber,
          registeredBy: exp.registeredBy?.fullName,
          createdAt: exp.createdAt,
        })),
      },
      financials: {
        initialAmount,
        totalCashIncome: Number(cashSales.toFixed(2)),
        totalCashInjections: Number(totalCashIn.toFixed(2)),
        totalCashExpenses: Number(totalCashExpenses.toFixed(2)),
        expectedCashInDrawer,
      },
      reconciliation:
        shift.status === ShiftStatus.CLOSED
          ? {
              actualCash: Number(shift.finalCashReported ?? 0),
              expectedCash: Number(shift.expectedCash ?? expectedCashInDrawer),
              difference: Number(shift.difference ?? 0),
            }
          : null,
    };
  }


  async getShiftsHistory(queryDto: QueryShiftsDto) {
    const { startDate, endDate, status = ShiftStatus.CLOSED, limit = 10, offset = 0 } = queryDto;

    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.openedBy', 'openedBy')
      .leftJoinAndSelect('shift.closedBy', 'closedBy')
      .orderBy('shift.openedAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (status) {
      queryBuilder.andWhere('shift.status = :status', { status });
    }

    if (startDate) {
      // Desde el inicio del día indicado (00:00:00)
      queryBuilder.andWhere('shift.openedAt >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    }

    if (endDate) {
      // Hasta el final del día indicado (23:59:59)
      queryBuilder.andWhere('shift.openedAt <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }

    const [shifts, total] = await queryBuilder.getManyAndCount();

    // Mapeamos los turnos con su balance y métricas clave
    const history = shifts.map((shift) => {
      const initial = Number(shift.initialAmount || 0);
      const expected = Number(shift.expectedCash || 0);
      const actual = shift.finalCashReported !== null && shift.finalCashReported !== undefined 
        ? Number(shift.finalCashReported) 
        : null;
      const difference = shift.difference !== null && shift.difference !== undefined 
        ? Number(shift.difference) 
        : null;

      let balanceStatus = 'EN_CURSO';
      if (shift.status === ShiftStatus.CLOSED && difference !== null) {
        if (difference === 0) balanceStatus = 'CUADRADA';
        else if (difference > 0) balanceStatus = 'SOBRANTE';
        else balanceStatus = 'FALTANTE';
      }

      return {
        id: shift.id,
        name: shift.shiftName,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        openedBy: shift.openedBy?.fullName || 'N/A',
        closedBy: shift.closedBy?.fullName || 'N/A',
        financials: {
          initialAmount: initial,
          expectedAmount: expected,
          actualAmount: actual,
          difference: difference,
          balanceStatus,
        },
        notes: shift.notes,
      };
    });

    return {
      total,
      limit,
      offset,
      shifts: history,
    };
  }
}
