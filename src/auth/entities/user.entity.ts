import { Product } from 'src/catalogo-inventario/entities/products.entity';
import { Expense } from 'src/expenses/entities/expense.entity';
import { DateFormatter } from 'src/helpers/date-formatter';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { unique: true, nullable: false })
  email!: string;

  @Column('text', { nullable: false, select: false })
  password!: string;

  @Column('text', { nullable: false })
  fullName!: string;

  @Column('bool', { default: true })
  isActive!: boolean;

  @Column('text', { array: true, default: ['user'] })
  roles!: string[];

  @Column('text', { default: DateFormatter.getDDMMMMYYY(new Date()) })
  createAt!: string;

  @OneToMany(() => Expense, (expense) => expense.registeredBy)
  expenses?: Expense[];

  //un usauario puede estar relacionado con muchos  productos
  @OneToMany(()=> Product, (product)=> product.user)
  product!:Product

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
