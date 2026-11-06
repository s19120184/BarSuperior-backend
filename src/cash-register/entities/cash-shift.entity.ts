import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CashMovement } from './cash-movement.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Expense } from '../../expenses/entities/expense.entity';

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity('cash_shifts')
export class CashShift {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column('varchar', { length: 50, default: 'Turno Principal' })
    shiftName!: string;

  @Column({
        type: 'enum',
        enum: ShiftStatus,
        default: ShiftStatus.OPEN,
    })
    status!: ShiftStatus;

  @Column('numeric', { precision: 10, scale: 2 })
    initialAmount!: number; // Fondo inicial de caja

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  finalCashReported?: number; // Lo que contó el cajero físicamente al cerrar

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  expectedCash?: number; // Lo calculado por el sistema

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  difference?: number; // Sobrante (+) o Faltante (-)

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => User, { eager: true, nullable: false })
    @JoinColumn({ name: 'opened_by' })
    openedBy!: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closedBy?: User;

  @OneToMany(() => CashMovement, (m) => m.cashShift)
    movements!: CashMovement[];

  @OneToMany(() => Payment, (p) => p.cashShift)
    payments!: Payment[];

  @OneToMany(() => Expense, (e) => e.cashShift)
    expenses!: Expense[];

  @CreateDateColumn({ name: 'opened_at', type: 'timestamptz' })
    openedAt!: Date;

  @Column('timestamptz', { nullable: true })
  closedAt?: Date;
}