
import { User } from 'src/auth/entities/user.entity';
import { CashShift } from 'src/cash-register/entities/cash-shift.entity';
import { Category } from 'src/catalogo-inventario/entities/categories.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';


export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  description!: string;

  @Column('numeric', { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod!: PaymentMethod;

  @Column('varchar', { length: 100, nullable: true })
  supplier?: string;


  @Column('date', { name: 'expense_date', default: () => 'CURRENT_DATE' })
  expenseDate!: string;

  @ManyToOne(() => Category, (category) => category.expenses, {
    nullable: false,
  })

  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  registeredBy!: User;

  // 👇 NUEVA RELACIÓN: Para vincular al arqueo de caja chica
  @ManyToOne(() => CashShift, (shift) => shift.expenses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cash_shift_id' })
  cashShift?: CashShift;

  @CreateDateColumn({ name: 'created_at', type: 'date', default:()=>"CURRENT_DATE"})
  createdAt!: Date;

  // Columna para borrado lógico (será null mientras no se borre)
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;


}
