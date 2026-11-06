import { CategoryType } from "src/catalogo-inventario/entities/categories.entity";

export interface SeedUser {
  fullName: string;
  email: string;
  password: string;
  roles: string[];
}

export interface SeedTable {
  number: number;
  capacity: number;
  zone: string;
}

export interface SeedCategory {
  title: string;
  description: string;
  type: CategoryType;
}

export interface SeedProduct {
  title: string;
  price: number;
  stock: number;
  is_prepared: boolean;
  categoryTitle: string;
}

export const SEED_DATA = {
  users: [
    {
      fullName: 'Carlos Administrador',
      email: 'admin@barsuperior.com',
      password: 'Password123!',
      roles: ['admin', 'cashier'],
    },
    {
      fullName: 'Luis Cajero',
      email: 'cajero@barsuperior.com',
      password: 'Password123!',
      roles: ['cashier'],
    },
    {
      fullName: 'Juan Mesero',
      email: 'mesero1@barsuperior.com',
      password: 'Password123!',
      roles: ['waiter'],
    },
  ],
  tables: [
    { number: 1, capacity: 4, zone: 'Salón Principal' },
    { number: 2, capacity: 4, zone: 'Salón Principal' },
    { number: 3, capacity: 6, zone: 'Salón Principal' },
    { number: 10, capacity: 2, zone: 'Barra' },
    { number: 11, capacity: 2, zone: 'Barra' },
    { number: 20, capacity: 4, zone: 'Terraza' },
    { number: 21, capacity: 8, zone: 'Terraza VIP' },
  ],
  categories: [
    {
      title: 'Cervezas',
      description: 'Cervezas nacionales, artesanales e importadas',
      type: CategoryType.PRODUCT,
    },
    {
      title: 'Coctelería',
      description: 'Tragos preparados, cocteles clásicos y de autor',
      type: CategoryType.PRODUCT,
    },
    {
      title: 'Destilados',
      description: 'Botellas y copas de Tequila, Mezcal, Whisky',
      type: CategoryType.PRODUCT,
    },
    {
      title: 'Botanas y Alimentos',
      description: 'Snacks y comida para acompañar',
      type: CategoryType.PRODUCT,
    },
    {
      title: 'Insumos Barra',
      description: 'Hielo, frutas, jarabes y materias primas',
      type: CategoryType.EXPENSE,
    },
  ],
 products: [
    {
      title: 'Cerveza Corona Extra 355ml',
      price: 50.0,
      stock: 48,
      is_prepared: false,
      categoryTitle: 'Cervezas', 
    },
    {
      title: 'Cerveza Victoria 355ml',
      price: 50.0,
      stock: 36,
      is_prepared: false,
      categoryTitle: 'Cervezas',
    },
    {
      title: 'Cerveza Artesanal IPA 355ml',
      price: 90.0,
      stock: 24,
      is_prepared: false,
      categoryTitle: 'Cervezas',
    },
    {
      title: 'Mojito Clásico',
      price: 95.0,
      stock: 0,
      is_prepared: true,
      categoryTitle: 'Coctelería',
    },
    {
      title: 'Margarita Tradicional',
      price: 110.0,
      stock: 0,
      is_prepared: true,
      categoryTitle: 'Coctelería',
    },
    {
      title: 'Papas a la Francesa 300g',
      price: 80.0,
      stock: 0,
      is_prepared: true,
      categoryTitle: 'Botanas y Alimentos',
    },
  ],
};