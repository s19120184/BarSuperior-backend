import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  INACTIVE = 'INACTIVE',
}


@Entity('tables')
export class Table{
    @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int', { unique: true })
  number!: number;

  @Column('int', { default: 4 })
  capacity!: number;

  @Column('varchar', { length: 50, default: 'Salón Principal' })
  zone!: string;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status!: TableStatus

  // Relación bidireccional con las órdenes
  // @OneToMany(() => Order, (order) => order.table)
  // orders: Order[];

  @CreateDateColumn({ name: 'created_at', type: 'date', default:()=>"CURRENT_DATE"})
  createdAt!: Date;

  @UpdateDateColumn({name:'updates_at', type:'date',})
  updatedAt!:Date
}