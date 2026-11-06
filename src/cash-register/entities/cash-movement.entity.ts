import { User } from 'src/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CashShift } from './cash-shift.entity';

export enum MovementType {
  IN = 'IN',
}

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: MovementType,
    default: MovementType.IN,
  })
  type!: MovementType;

  @Column('numeric', { precision: 10, scale: 2 })
  amount!: number;

  @Column('varchar', { length: 255 })
  reason!: string; // Ej: "Aportación de cambio billetes de 20 y 50"

  @ManyToOne(() => CashShift, (shift) => shift.movements, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'cash_shift_id' })
  cashShift!: CashShift;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
