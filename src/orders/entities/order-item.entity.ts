import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Product } from 'src/catalogo-inventario/entities/products.entity';
import { Order } from './order.entity';
//import { Product } from '../../catalogo-inventario/products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  quantity!: number;

  @Column('numeric', { precision: 10, scale: 2 })
  unitPrice!: number;

  @Column('numeric', { precision: 10, scale: 2 })
  subtotal!: number;

  @Column('varchar', { length: 255, nullable: true })
  notes?: string | null; // Ej: "Sin sal", "Con mucho hielo", "Para llevar"

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}