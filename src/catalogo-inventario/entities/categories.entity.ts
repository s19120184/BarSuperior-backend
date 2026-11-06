import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './products.entity';
import { Expense } from 'src/expenses/entities/expense.entity';

export enum CategoryType {
  PRODUCT = 'PRODUCT', // Para el menú de venta (Cervezas, Cócteles, Botellas)
  EXPENSE = 'EXPENSE', // Para egresos (Insumos, Licores a mayoreo, Mantenimiento)
  BOTH = 'BOTH', // Si algo aplica para ambos (ej. "Cerveza" si se cataloga igual)
}

@Entity({ name: 'category' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { unique: true })
  title!: string;

  @Column('text', { unique: true, nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    default: CategoryType.PRODUCT,
  })
  type?: CategoryType;

  //una categoria puede tener muchos productos
  @OneToMany(
    () => Product,
    (product) => product.category,
    { onDelete: 'CASCADE' }, //para elimnar en cascada
  )
  product!: Product[];

  // Gastos registrados bajo este rubro
  @OneToMany(() => Expense, (expense) => expense.category)
  expenses!: Expense[];

  @BeforeInsert()
  @BeforeUpdate()
  checkTitle() {
    if (this.title) {
      this.title = this.title.trim().toUpperCase();
    }
  }
}
