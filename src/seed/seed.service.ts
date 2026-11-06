import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { CatalogoInventarioService } from 'src/catalogo-inventario/catalogo-inventario.service';
import { Category } from 'src/catalogo-inventario/entities/categories.entity';
import { Product } from 'src/catalogo-inventario/entities/products.entity';
import { ProductsService } from 'src/catalogo-inventario/product.service';
import { DataSource, Repository } from 'typeorm';
import { SEED_DATA } from './data/seed-data';
import { Table, TableStatus } from 'src/tables/entities/table.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {


    constructor(
        private readonly catalogoInvenarioService:CatalogoInventarioService,
        private readonly productService:ProductsService,

        @InjectRepository(User)
        private readonly userRepository:Repository<User>,
        private readonly dataSource: DataSource
    ){

    }

  
  private async deleteTables(queryRunner: any) {
    // Truncar o borrar respetando llaves foráneas
    await queryRunner.query('DELETE FROM payments');
    await queryRunner.query('DELETE FROM order_items');
    await queryRunner.query('DELETE FROM orders');
    await queryRunner.query('DELETE FROM cash_movements');
    await queryRunner.query('DELETE FROM expenses');
    await queryRunner.query('DELETE FROM cash_shifts');
    await queryRunner.query('DELETE FROM products');
    await queryRunner.query('DELETE FROM category');
    await queryRunner.query('DELETE FROM tables');
    await queryRunner.query('DELETE FROM users');
  }

  private async insertUsers(queryRunner: any): Promise<User[]> {
    const usersToInsert = SEED_DATA.users.map((u) => {
      const user = queryRunner.manager.create(User, {
        fullName: u.fullName,
        email: u.email,
        password: bcrypt.hashSync(u.password, 10),
        roles: u.roles,
        isActive: true,
      });
      return user;
    });

    return await queryRunner.manager.save(usersToInsert);
  }

  private async insertTables(queryRunner: any): Promise<Table[]> {
    const tablesToInsert = SEED_DATA.tables.map((t) => {
      return queryRunner.manager.create(Table, {
        number: t.number,
        capacity: t.capacity,
        zone: t.zone,
        status: TableStatus.AVAILABLE,
        is_active: true,
      });
    });

    return await queryRunner.manager.save(tablesToInsert);
  }


  // 1. Modifica runSeed para pasar el primer usuario (Admin) a insertProducts:
  async runSeed() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await this.deleteTables(queryRunner);

      // Guardamos los usuarios insertados para usar el admin como creador
      const users = await this.insertUsers(queryRunner);
      const adminUser = users[0]; // Carlos Administrador

      const tables = await this.insertTables(queryRunner);
      const categoriesMap = await this.insertCategories(queryRunner);

      // Pasamos adminUser a insertProducts
      const products = await this.insertProducts(queryRunner, categoriesMap, adminUser);

      return {
        message: '¡Seed ejecutado con éxito! Base de datos inicializada.',
        summary: {
          usersCount: users.length,
          tablesCount: tables.length,
          categoriesCount: categoriesMap.size,
          productsCount: products.length,
        },
        credentials: {
          admin: 'admin@barsuperior.com / Password123!',
          cashier: 'cajero@barsuperior.com / Password123!',
          waiter: 'mesero1@barsuperior.com / Password123!',
        },
      };
    } catch (error) {
      console.error('Error al ejecutar Seed:', error);
      throw new InternalServerErrorException('Error ejecutando seed en la base de datos');
    } finally {
      await queryRunner.release();
    }
  }

  // 2. Método insertCategories asegurando que el title se guarde correctamente:
  private async insertCategories(queryRunner: any): Promise<Map<string, Category>> {
    const categoryMap = new Map<string, Category>();

    for (const catData of SEED_DATA.categories) {
      const category = queryRunner.manager.create(Category, {
        title: catData.title.trim().toUpperCase(),
        description: catData.description,
        type: catData.type,
      });

      const saved = await queryRunner.manager.save(category);
      categoryMap.set(saved.title.toUpperCase(), saved);
      categoryMap.set(catData.title.toUpperCase(), saved);
    }

    return categoryMap;
  }

  // 3. Método insertProducts asignando sizes y user:
  private async insertProducts(
    queryRunner: any,
    categoriesMap: Map<string, Category>,
    adminUser: User,
  ): Promise<Product[]> {
    const productsToInsert = SEED_DATA.products.map((p) => {
      const category = categoriesMap.get(p.categoryTitle.toUpperCase());

      if (!category) {
        throw new Error(
          `Categoría "${p.categoryTitle}" no encontrada al asociar el producto "${p.title}"`,
        );
      }

      return queryRunner.manager.create(Product, {
        title: p.title,
        price: p.price,
        stock: p.stock ?? 0,
        is_prepared: p.is_prepared ?? false,
        is_active: true,
        sizes: ['Unica'], // 👈 Cumple con @Column('text', { array: true })
        category,
        user: adminUser,  // 👈 Cumple con la relación obligatoria con User
      });
    });

    return await queryRunner.manager.save(productsToInsert);
  }
}
