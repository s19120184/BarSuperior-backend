import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../auth/entities/user.entity';
import { CashShift } from 'src/cash-register/entities/cash-shift.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column('numeric', { precision: 10, scale: 2 })
    amount!: number; // Monto aplicado al consumo de la cuenta

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
    tip!: number; // Propina voluntaria adicional

  @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
    })
    method!: PaymentMethod;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  receivedAmount?: number; // Cuánto entregó el cliente en efectivo

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  change?: number; // Vuelto / cambio entregado

  @Column('varchar', { length: 100, nullable: true })
  transactionReference?: string; // Número de autorización del voucher/transferencia

  @ManyToOne(() => Order, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'order_id' })
    order!: Order;

  @ManyToOne(() => User, { nullable: false, eager: true })
    @JoinColumn({ name: 'cashier_id' })
    cashier!: User; // Cajero o usuario que procesó el cobro
  
    // Turno/sesión de caja activa en el que ingresó este dinero (para arqueo y corte Z)
  @ManyToOne(() => CashShift, (shift) => shift.payments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cash_shift_id' })
  cashShift?: CashShift;

  @CreateDateColumn({ name: 'created_at', type: 'date', default:()=>"CURRENT_DATE" })
    createdAt!: Date;
}