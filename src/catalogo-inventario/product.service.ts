import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from './entities/categories.entity';
import { DataSource, Repository } from 'typeorm';
import { handleDBExceptions } from 'src/helpers/handleDBExceptions';

import { validate as isUUID } from 'uuid';
import { CreateProductDto, UpdateProductDto } from './dto';
import { User } from 'src/auth/entities/user.entity';
import { formatSlug } from 'src/helpers/slug-formatter';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { off } from 'process';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // CREATE CON QUERYRUNNER (TRANSACTION)
  // ==========================================
  async create(createProductDto: CreateProductDto, user: User) {
    const { images = [], categoryId, ...productDetails } = createProductDto;

    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found`);
    }

    //reservar una conexion exclusiva del pool
    const queryRunner = this.dataSource.createQueryRunner();

    //conecarser a la base de datos
    await queryRunner.connect();

    //iniciar la transaccion
    await queryRunner.startTransaction();

    try {
      // 1. Instanciar la entidad del producto vinculando la categoría
      const product = queryRunner.manager.create(Product, {
        ...productDetails,
        category,
        user,
      });

      // 2. Guardar producto para generar su ID (ejecuta @BeforeInsert)
      const savedProduct = await queryRunner.manager.save(product);

      // 3. Crear y guardar las imágenes asociadas si existen
      if (images.length > 0) {
        const productImages = images.map((url) =>
          queryRunner.manager.create(ProductImage, {
            url,
            product: savedProduct,
          }),
        );
        await queryRunner.manager.save(productImages);
      }

      // 4. Confirmar la transacción
      await queryRunner.commitTransaction();

      return this.findOnePlain(savedProduct.id);
    } catch (error) {
      // Revertir cambios en caso de error
      await queryRunner.rollbackTransaction();
      handleDBExceptions(error, 'ProducService');
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
  }

  // ==========================================
  // FIND ONE (UUID, SLUG O TÍTULO)
  // ==========================================
  async findOne(term: string): Promise<Product> {
    let product: Product | null = null;

    if (isUUID(term)) {
      product = await this.productRepository.findOne({
        where: { id: term },
        relations: { images: true, category: true },
      });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(prod.title) = :term OR slug = :term', {
          term: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .leftJoinAndSelect('prod.category', 'prodCategory')
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with term "${term}" not found`);
    }

    return product;
  }

  async findOnePlain(term: string) {
    const product = await this.findOne(term);
    return {
      ...product,
      images: product.images ? product.images.map((image) => image.url) : [],
    };
  }

  // ==========================================
  // UPDATE CON QUERYRUNNER (TRANSACTION)
  // ==========================================
  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, categoryId, ...toUpdate } = updateProductDto;

    // preload busca la entidad y le asigna las nuevas propiedades en memoria
    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
      // Si cambiaron el título pero NO mandaron slug, limpiamos slug para que tome el nuevo title
      ...(toUpdate.title && !toUpdate.slug
        ? { slug: formatSlug(toUpdate.title) }
        : {}),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: categoryId,
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${categoryId}" not found`,
        );
      }
      product.category = category;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Si vienen imágenes en el DTO, sincronizamos
      if (images) {
        // Borramos las imágenes existentes vinculadas a este producto
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        // Instanciamos las nuevas imágenes vinculando explícitamente el producto
        const newProductImages = images.map((url) =>
          queryRunner.manager.create(ProductImage, {
            url,
            product, //  VINCULACIÓN CLAVE
          }),
        );

        // Guardamos explícitamente las entidades hijas en la base de datos
        await queryRunner.manager.save(newProductImages); //  PERSISTENCIA DIRECTA
      }

      product.user = user;

      // 2. Guardamos la entidad principal
      await queryRunner.manager.save(product);

      // 3. Confirmamos la transacción
      await queryRunner.commitTransaction();

      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleDBExceptions(error, 'ProductService');
    } finally {
      await queryRunner.release();
    }
  }

  // ==========================================
  // REMOVE (activar y desactivar el producto)
  // ==========================================
  async remove(id: string) {
    const product = await this.findOne(id);

    product.is_active = !product.is_active;

    await this.productRepository.save(product);
    ///await this.productRepository.remove(product);
  }

  //==================================
  // FindAll (paginacion)
  //============================

  // async findAll(paginationDto: PaginationDto) {
  //   const { limit = 20, offset = 0 } = paginationDto;

  //   const products = await this.productRepository.find({
  //     take: limit,
  //     skip: offset,
  //     relations: {
  //       images: true,
  //       category: true,
  //     },
  //   });

  //   return products.map((product) => ({
  //     ...product,
  //     images: product.images.map((img) => img.url),
  //   }));
  // }


 async findAllForPos() {
  const products = await this.productRepository.find({
    where: {
      is_active: true, // 👈 Solo productos habilitados para venta
    },
    relations: {
      images: true,
      category: true,
    },
    order: {
      title: 'ASC',
    },
  });

  return products.map((product) => ({
    ...product,
    images: product.images ? product.images.map((img) => img.url) : [],
  }));
}


  async findAll(paginationDto: PaginationDto) {
  const { limit = 10, offset = 0, search, categoryId } = paginationDto;

  const queryBuilder = this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.images', 'images')
    .leftJoinAndSelect('product.category', 'category')
    .take(limit)
    .skip(offset)
    .orderBy('product.title', 'ASC');

  if (categoryId) {
    queryBuilder.andWhere('category.id = :categoryId', { categoryId });
  }

  if (search && search.trim() !== '') {
    queryBuilder.andWhere('LOWER(product.title) LIKE :search', {
      search: `%${search.toLowerCase().trim()}%`,
    });
  }

  const [products, total] = await queryBuilder.getManyAndCount();

  const formattedProducts = products.map((product) => ({
    ...product,
    images: product.images ? product.images.map((img) => img.url) : [],
  }));

  return {
    total,
    limit,
    offset,
    products: formattedProducts,
  };
}
}
