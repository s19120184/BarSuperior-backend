import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Table } from '../../tables/entities/table.entity';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from 'src/payments/entities/payment.entity';

export enum OrderStatus {
  OPEN = 'OPEN', // Mesa consumiendo
  CLOSED = 'CLOSED', // Cuenta pedida / lista para cobro
  PAID = 'PAID', // Cobrada en caja
  CANCELLED = 'CANCELLED', // Cancelada por administrador
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.OPEN,
  })
  status!: OrderStatus;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  total!: number;

  @ManyToOne(() => Table, { eager: true, nullable: false })
  @JoinColumn({ name: 'table_id' })
  table!: Table;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  waiter!: User;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    //eager: true,
  })
  items!: OrderItem[];

  // ... dentro de la clase Order:
  @OneToMany(() => Payment, (payment) => payment.order)
  payments!: Payment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
